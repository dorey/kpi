# coding: utf-8
import datetime
import hashlib
import json


from django.contrib.postgres.fields import JSONField as JSONBField
from django.db import models
from django.utils import timezone

from jsondiff import patch as jsondiff_patch
from jsondiff import diff as jsondiff_diff

from a1d05eba1 import Content

from formpack.utils.expand_content import expand_content
from reversion.models import Version

from kpi.fields import KpiUidField
from kpi.utils.kobo_to_xlsform import to_xlsform_structure
from kpi.utils.strings import hashable_str

DEFAULT_DATETIME = datetime.datetime(2010, 1, 1)


class AssetVersion(models.Model):
    uid = KpiUidField(uid_prefix='v')
    asset = models.ForeignKey('Asset', related_name='asset_versions',
                              on_delete=models.CASCADE)
    name = models.CharField(null=True, max_length=255)
    date_modified = models.DateTimeField(default=timezone.now)

    # preserving _reversion_version in case we don't save all that we
    # need to in the first migration from reversion to AssetVersion
    _reversion_version = models.OneToOneField(Version,
                                              null=True,
                                              on_delete=models.SET_NULL,
                                              )
    version_content = JSONBField()
    uid_aliases = JSONBField(null=True)
    deployed_content = JSONBField(null=True)
    _deployment_data = JSONBField(default=dict)
    deployed = models.BooleanField(default=False)

    class Meta:
        ordering = ['-date_modified']

    def _deployed_content(self):
        if self.deployed_content is not None:
            return self.deployed_content
        legacy_names = self._reversion_version is not None
        if legacy_names:
            return to_xlsform_structure(self.version_content,
                                        deprecated_autoname=True)
        else:
            return to_xlsform_structure(self.version_content,
                                        move_autonames=True)

    def to_formpack_schema(self):
        return {
            'content': expand_content(self._deployed_content()),
            'version': self.uid,
            'version_id_key': '__version__',
        }


    def diff_from_previous(self):
        _avs = self.asset.asset_versions
        _ordered = _avs.order_by('-date_modified')
        prev = _ordered.filter(date_modified__lt=self.date_modified).first()
        return self.diff_from(prev)

    @classmethod
    def apply_patch(kls, **kwargs):
        # example:
        # AssetVersion.apply_patch(parent_uid='vXxXx',
        #                          patch={'survey': {'ww79d09':
        #                                 {'name': 'number1'}}},
        #                          save=True)
        patch = kwargs.get('patch')
        save = kwargs.pop('save', False)
        parent_uid = kwargs.get('parent_uid')
        schema = kwargs.get('schema', '2+anchors')
        syntax = kwargs.get('syntax', 'jsondiff.compact')
        vv = kls.objects.get(uid=parent_uid)
        vvc = vv.version_content
        cc1 = Content(vvc).export(schema=schema)
        content = {}
        if syntax == 'jsondiff.compact':
            content = Content(
                jsondiff_patch(cc1, patch, marshal=True, syntax='compact')
            ).export(schema='2')
        if save:
            asset = vv.asset
            asset.content = content
            asset.save()
        return content


    def diff_from(self, parent_version=None, syntax='compact'):
        # if no other 'schema' is set, this is the default:
        schema_in = '1+flattened_translations'

        # the diff compares versions with this schema:
        schema_out = '2+anchors'

        def _to_schema_2(cc):
            content = cc if 'schema' in cc else {**cc, 'schema': '1+::'}
            return Content(content).export(schema=schema_out)

        # current version content
        cvc = _to_schema_2(self.version_content)
        # previous version content
        pvc = {}
        parent_uid = None

        if parent_version is not None:
            parent_uid = parent_version.uid
            pvc = _to_schema_2(parent_version.version_content)

        return {'parent': parent_uid,
                'syntax': 'jsondiff.{}'.format(syntax),
                'schema': schema_out,
                'patch': jsondiff_diff(pvc, cvc, marshal=True, syntax=syntax),
                'uid': self.uid,}

    @property
    def content_hash(self):
        # used to determine changes in the content from version to version
        # not saved, only compared with other asset_versions
        _json_string = json.dumps(self.version_content, sort_keys=True)
        return hashlib.sha1(hashable_str(_json_string)).hexdigest()

    def __str__(self):
        return '{}@{} T{}{}'.format(
            self.asset.uid, self.uid,
            self.date_modified.strftime('%Y-%m-%d %H:%M'),
            ' (deployed)' if self.deployed else '')

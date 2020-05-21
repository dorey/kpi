# coding: utf-8
from django.core.management.base import BaseCommand

from django.db import models

from kpi.models import Asset

from kobo.apps.formschema.content import Content


from pprint import pprint


class Command(BaseCommand):
    def handle(self, *args, **options):
        # asset = Asset.objects.get(uid='aPjXjohin4HVnsAVoBF4iJ')
        asset = Asset.objects.get(uid='a5i3gbhfeEDNcGVY8Afx5f')

        asset.delete()
        # import pprint; print("»asset.content['choices']"); pprint.pprint(asset.content)
        # import pprint; print("»asset.date_modified"); pprint.pprint(asset.date_modified)
        # print(asset.content.get('translated'))
        # cc = Content(asset.content)
        #
        # print(cc.export(schema='2'))

import React from 'react';
import Reflux from 'reflux';
import Dropzone from 'react-dropzone';
import _ from 'underscore';
import { Link } from 'react-router';
import actions from '../actions';
import bem from '../bem';
import stores from '../stores';
import Select from 'react-select';
import ui from '../ui';
import mixins from '../mixins';
import DocumentTitle from 'react-document-title';
import CopyToClipboard from 'react-copy-to-clipboard';
import AutosizeInput from 'react-input-autosize';
import icons from '../../xlform/src/view.icons';
import $ from 'jquery';

import {
  formatTime,
  currentLang,
  assign,
  t,
  log,
  notify,
  validFileTypes
} from '../utils';

let typingTimer;


const TranslationProgressBar = React.createClass({
  getInitialState() {
    return {
      pixelWidth: `${this.props.pct * 100}%`,
    };
  },
  render () {
    return (
        <div>
          <div style={{
            width: '80%',
            height: 16,
            display: 'inline-block',
            overflow: 'hidden',
            borderRadius: 2,
            backgroundColor: '#daf6ed',
          }}>
            <div style={{
              width: this.state.pixelWidth,
              height: 16,
              backgroundColor: '#1ec185',
              display: 'inline-block',
            }}>
              {' '}
            </div>
          </div>
          <span style={{
            float: 'right',
          }}>
            {this.state.pixelWidth}
          </span>
        </div>
      )
  },
});

const TranslationItem = React.createClass({
  getInitialState () {
    return {
      name: this.props.name,
      code: this.props.code,
    };
  },
  render () {
    let l = this.props;
    return (
      <bem.FormView__group m="items" key={this.props.code} >
        <bem.FormView__label m='language-name'>
          <AutosizeInput type="text"
                data-langCode={l.code}
                name="langName"
                value={l.name}
                onKeyPress={this.nameValidate}
                onChange={this.langChange}
          />
          <AutosizeInput type="text"
                data-langName={l.name}
                name="langCode"
                style={{float: 'right'}}
                value={l.code}
                onKeyPress={this.codeValidate}
                onChange={this.langChange}
          />
        </bem.FormView__label>
        <bem.FormView__label m='progress'>
          {
            this.props.source ? (
                <bem.FormView__cell m={['highlighted', 'sourcetag']}>
                  {t('Source')}
                </bem.FormView__cell>
              ) : (
                <TranslationProgressBar pct={0.10} />
              )
          }
        </bem.FormView__label>
        <bem.FormView__label m='buttons'>
          <bem.FormView__link m='edit'
              data-tip={t('Edit this translation')}
              data-language={`${l.name} (${l.code})`}
              onClick={this.setActiveLanguage}>
            <i className="k-icon-edit" />
          </bem.FormView__link>
        </bem.FormView__label>
      </bem.FormView__group>
    );
  },
});

const TranslationList = React.createClass({
  getInitialState () {
    return {
      translations: this.props.content.translations,
    }
  },
  langChange () {

  },
  render () {
    let translations = this.state.translations.map(function(name, n){
      return {
        name: name,
        code: `t${n}`,
      }
    });
    return (
      <bem.FormView__cell m={['padding', 'bordertop', 'languages']}>
        <bem.FormView__group m={["headings", "items"]}>
          <bem.FormView__label m='language'>{t('Translations')}</bem.FormView__label>
          <bem.FormView__label m='buttons'></bem.FormView__label>
        </bem.FormView__group>
        {translations &&
          translations.map((l, n) => {
            return (
                <TranslationItem name={l.name}
                  source={n===0}
                  code={l.code} key={l.code}
                />
              );
        })}
      </bem.FormView__cell>
    );
  }
});

var FormLanding = React.createClass({
  mixins: [
    mixins.droppable,
    mixins.dmix,
    Reflux.ListenerMixin
  ],
  getInitialState () {
    return {
      questionLanguageIndex: 0,
      selectedCollectMethod: 'offline_url'
    };
  },
  componentDidMount() {
    this.listenTo(stores.asset, this.assetStoreChange);
  },
  assetStoreChange(data) {
    var langList = [];
    // this.state.content.translations.map((l, n) => {
    //   var langName = l.split('(');
    //   var langCode = langName[1].split(')');

    //   langList[n] = {
    //     code: langCode[0],
    //     name: langName[0].trim()
    //   };
    // });
    log('this.state.content.translations', this.state.content.translations);
    this.setState({
      // langList: langList,
      langList: this.state.content.translations,
    });
  },
  enketoPreviewModal (evt) {
    evt.preventDefault();
    stores.pageState.showModal({
      type: 'enketo-preview',
      assetid: this.state.uid
    });
  },
  langChange (evt) {
    // var langList = this.state.langList;
    // var langName = evt.target.getAttribute('data-langName') || evt.target.value;
    // var index = evt.target.getAttribute('data-index');
    // var langCode = evt.target.getAttribute('data-langCode') || evt.target.value;

    // langList[index] = {
    //   code: langCode, 
    //   name: langName
    // }
    // this.setState({
    //   langList: langList
    // });

    // clearTimeout(typingTimer);

    // typingTimer = setTimeout(() => { 
    //   if (!langName && !langCode) {
    //     alertify.error(t('The language name or code cannot be empty.'));
    //   } else {
    //     var content = this.state.content;
    //     langList.map((l, n) => {
    //       content.translations[n] = `${l.name} (${l.code})`;
    //     });

    //     actions.resources.updateAsset(
    //       this.state.uid, {
    //         translations: JSON.stringify(content.translations)
    //       }
    //     );
    //   }
    // }, 1000);

  },
  nameValidate(e) {
    if (e.key.replace(/[^\w\s\-.]/g,'')=='') e.preventDefault();
  },
  codeValidate(e) {
    if (e.key.replace(/[^\w\-.]/g,'')=='') e.preventDefault();
  },
  renderFormInfo () {
    var dvcount = this.state.deployed_versions.length;
    return (
        <bem.FormView__cell m={['columns', 'padding']}>
          <bem.FormView__cell>
            <bem.FormView__cell m='version'>
              {dvcount > 0 ? `v${dvcount}` : ''}
            </bem.FormView__cell>
            <bem.FormView__cell m='date'>
              {t('Last Modified')}&nbsp;:&nbsp;
              {formatTime(this.state.date_modified)}&nbsp;-&nbsp;
              <span className="question-count">
                {this.state.summary.row_count || '0'}&nbsp;
                {t('questions')}
                </span>
            </bem.FormView__cell>
          </bem.FormView__cell>
          <bem.FormView__cell m='buttons'>
            {this.state.userCanEdit && 
              <a
                className="mdl-button mdl-button--raised mdl-button--colored"
                onClick={this.deployAsset}>
                  {this.state.has_deployment ? t('redeploy') : t('deploy')}
              </a>
            }
          </bem.FormView__cell>
        </bem.FormView__cell>
      );
  },
  setActiveLanguage (evt) {
    var el = $(evt.target).closest('[data-language]').get(0);
    var language = el.getAttribute('data-language');
    // var content = this.state.content;
    // hashHistory.push(`/forms/${asset.uid}/edit`);
  },
  renderFormLanguages () {
    return (
        <TranslationList content={this.state.content} />
      );
  },
  sharingModal (evt) {
    evt.preventDefault();
    stores.pageState.showModal({
      type: 'sharing', 
      assetid: this.state.uid
    });
  },
  // renderQuestionsSummary () {
  //   var survey = this.state.content.survey || [];
  //   return (
  //     <bem.FormView__cell m={['padding', 'bordertop', 'questions', 'columns']}>
  //       <bem.FormView__cell m='label'>
  //         <div>{t('Questions')}</div>
  //         <div className="question-count">{this.state.summary.row_count}</div>
  //       </bem.FormView__cell>
  //       <bem.FormView__cell m={['question-list']}>
  //         {survey.map((s, i)=>{
  //           if (s.label == undefined) return false;
  //           var icon = icons._byId[s.type];
  //           if (!icon) {
  //             return false;
  //           }

  //           var faClass = `fa-${icon.attributes.faClass}`;
  //           return (
  //               <div key={`survey-${i}`}>
  //                 <i className={`fa fa-fw ${faClass}`} />
  //                 <span>{s.label[this.state.questionLanguageIndex]}</span>
  //               </div>
  //             );
  //         })}
  //       </bem.FormView__cell>
  //     </bem.FormView__cell>
  //   );
  // },
  renderHistory () {
    var dvcount = this.state.deployed_versions.length;
    return (
      <bem.FormView__row className={this.state.historyExpanded ? 'historyExpanded' : 'historyHidden'}>
        <bem.FormView__cell m={['columns', 'history-label']}>
          <bem.FormView__cell m='label'>
            {t('Form history')}
          </bem.FormView__cell>
        </bem.FormView__cell>
        <bem.FormView__cell m={['box', 'history-table']}>
          <bem.FormView__group m="deployments">
            <bem.FormView__group m={['items', 'headings']}>
              <bem.FormView__label m='version'>{t('Version')}</bem.FormView__label>
              <bem.FormView__label m='date'>{t('Last Modified')}</bem.FormView__label>
              <bem.FormView__label m='clone'>{t('Clone')}</bem.FormView__label>
            </bem.FormView__group>
            {this.state.deployed_versions.map((item, n) => {
              return (
                <bem.FormView__group m="items" key={n} >
                  <bem.FormView__label m='version'>
                    {`v${dvcount-n}`}
                    {item.uid === this.state.deployed_version_id && this.state.deployment__active && 
                      <bem.FormView__cell m='highlighted'>
                        {t('Deployed')}
                      </bem.FormView__cell>
                    }
                  </bem.FormView__label>
                  <bem.FormView__label m='date'>
                    {formatTime(item.date_deployed)}
                  </bem.FormView__label>
                  <bem.FormView__label m='clone' className="right-tooltip">
                      <bem.FormView__link m='clone'
                          data-version-id={item.uid}
                          data-tip={t('Clone this version as a new project')}
                          onClick={this.saveCloneAs}>
                        <i className="k-icon-clone" />
                      </bem.FormView__link>
                  </bem.FormView__label>
                </bem.FormView__group>
              );
            })}
          </bem.FormView__group>
        </bem.FormView__cell>
        {this.state.deployed_versions.length > 1 &&
          <bem.FormView__cell m={['centered']}>
            <button className="mdl-button mdl-button--colored" onClick={this.toggleDeploymentHistory}>
              {this.state.historyExpanded ? t('Hide full history') : t('Show full history')}
            </button>
          </bem.FormView__cell>
        }
      </bem.FormView__row>
      );
  },
  renderCollectData () {
    var deployment__links = this.state.deployment__links;

    var available__links = {
        offline_url: {
          label: t('Online-Offline (multiple submission)'),
          desc: t('This allows online and offline submissions and is the best option for collecting data in the field. ')
        },
        url: {
          label: t('Online-Only (multiple submissions)'),
          desc: t('This is the best option when entering many records at once on a computer, e.g. for transcribing paper records')
        },
        iframe_url: {
          label: t('Embeddable web form code'),
          desc: t('Use this html5 code snippet to integrate your form on your own website using smaller margins. ')
        },
        preview_url: {
          label: t('View only'),
          desc: t('Use this version for testing, getting feedback. Does not allow submitting data. ')
        },
        android: {
          label: t('Android application'),
          desc: t('Use this option to collect data in the field with your Android device.')
        }
    };

    var deployment__links_list = [];
    for (var key in available__links) {
      deployment__links_list.push(
        {
          key: key,
          label: available__links[key].label,
          desc: available__links[key].desc
        }
      );

    }

    var chosenMethod = this.state.selectedCollectMethod;

    var kc_server = document.createElement('a');
    kc_server.href = this.state.deployment__identifier;
    var kobocollect_url = kc_server.origin + '/' + this.state.owner__username;

    return (
      <bem.FormView__row>
        <bem.FormView__cell m='columns'>
          <bem.FormView__cell m='label'>
              {t('Collect data')}
          </bem.FormView__cell>
        </bem.FormView__cell>
        <bem.FormView__cell m='box'>
          <bem.FormView__cell m={['columns', 'padding']}>
            <bem.FormView__cell>
              <ui.PopoverMenu type='collectData-menu' triggerLabel={available__links[chosenMethod].label}>
                {deployment__links_list.map((c)=>{
                  return (
                      <bem.PopoverMenu__link m={['collect-row']} 
                                             key={`c-${c.key}`}
                                             data-method={c.key}
                                             onClick={this.setCollectMethod}>
                        <div className="collect-data-label">{c.label}</div>
                        <div className="collect-data-desc">{c.desc}</div>
                        <div className="collect-data-desc">{c.value}</div>
                      </bem.PopoverMenu__link>
                    );
                })}
              </ui.PopoverMenu>
            </bem.FormView__cell>
            <bem.FormView__cell>
              {chosenMethod != 'iframe_url' && chosenMethod != 'android' &&
                <CopyToClipboard text={this.state.deployment__links[chosenMethod]} onCopy={() => notify('copied to clipboard')}>
                  <button className="copy mdl-button mdl-button--colored">{t('Copy')}</button>
                </CopyToClipboard>
              }
              {chosenMethod != 'iframe_url' && chosenMethod != 'android' &&
                <a className="collect-link mdl-button mdl-button--colored" 
                   target="_blank" 
                   href={this.state.deployment__links[chosenMethod]}>
                  {t('Open')}
                </a>
              }
              { chosenMethod == 'android' &&
                <a className="collect-link mdl-button mdl-button--colored" 
                   target="_blank" 
                   href='https://play.google.com/store/apps/details?id=org.koboc.collect.android&hl=en'>
                   {t('Download KoboCollect')}
                </a>
              }
              {chosenMethod == 'iframe_url' &&
                <CopyToClipboard text={`<iframe src=${this.state.deployment__links[chosenMethod]} width="800" height="600"></iframe>`} 
                                 onCopy={() => notify('copied to clipboard')}>
                  <button className="copy mdl-button mdl-button--colored">{t('Copy')}</button>
                </CopyToClipboard>
              }
            </bem.FormView__cell>
          </bem.FormView__cell>
          <bem.FormView__cell m={['padding', 'bordertop', 'collect-meta']}>
            {chosenMethod != 'android' &&
              available__links[chosenMethod].desc
            }

            {chosenMethod == 'iframe_url' &&
              <pre>
                {`<iframe src=${this.state.deployment__links[chosenMethod]} width="800" height="600"></iframe>`}
              </pre>
            }

            {chosenMethod == 'android' &&
              <ol>
                <li>
                  {t('Install')}
                  &nbsp;
                  <a href="https://play.google.com/store/apps/details?id=org.koboc.collect.android&hl=en" target="_blank">KoboCollect</a>
                  &nbsp;
                  {t('on your Android device.')}
                </li>
                <li>{t('Click on')} <i className="fa fa-ellipsis-v"></i> {t('to open settings.')}</li>
                <li>
                  {t('Enter the server URL')}&nbsp;
                  <code>{kobocollect_url}</code>&nbsp;
                  {t('and your username and password')}
                </li>
                <li>{t('Open "Get Blank Form" and select this project. ')}</li>
                <li>{t('Open "Enter Data."')}</li>
              </ol>
            }

          </bem.FormView__cell>
        </bem.FormView__cell>
      </bem.FormView__row>
    );
  },
  setCollectMethod(evt) {
    var method = $(evt.target).parents('.popover-menu__link').data('method');
    this.setState({
        selectedCollectMethod: method
      }
    );
  },
  renderButtons () {
    var downloadable = false;
    var downloads = [];
    if (this.state.downloads) {
      downloadable = !!this.state.downloads[0];
      downloads = this.state.downloads;
    }

    return (
        <bem.FormView__group m='buttons'>
          {this.state.userCanEdit ? 
            <Link to={`/forms/${this.state.uid}/edit`} 
                  className="form-view__link form-view__link--edit"
                  data-tip={t('edit')}>
              <i className="k-icon-edit" />
            </Link>
          : 
            <bem.FormView__link m={'edit'}
              data-tip={t('Editing capabilities not granted, you can only view this form')}>
              <i className="k-icon-edit" />
            </bem.FormView__link>
          }
          <bem.FormView__link m='preview'
            onClick={this.enketoPreviewModal}
            data-tip={t('Preview')}>
            <i className="k-icon-view" />
          </bem.FormView__link>
          {this.state.userCanEdit && 
            <Dropzone onDrop={this.dropFiles} 
                          multiple={false} 
                          className='dropzone' 
                          accept={validFileTypes()}>
              <bem.FormView__link m='upload' data-tip={t('Replace with XLS')}>
                <i className="k-icon-replace" />
              </bem.FormView__link>
            </Dropzone>
          }

          <ui.PopoverMenu type='formLanding-menu' 
                      triggerLabel={<i className="k-icon-more" />} 
                      triggerTip={t('More Actions')}>
              {downloads.map((dl)=>{
                return (
                    <bem.PopoverMenu__link m={`dl-${dl.format}`} href={dl.url}
                        key={`dl-${dl.format}`}>
                      <i className={`k-icon-${dl.format}-file`}/>
                      {t('Download')}&nbsp;
                      {dl.format.toString().toUpperCase()}
                    </bem.PopoverMenu__link>
                  );
              })}
              {this.state.userCanEdit && 
                <bem.PopoverMenu__link onClick={this.sharingModal}>
                  <i className="k-icon-share"/>
                  {t('Share this project')}
                </bem.PopoverMenu__link>
              }
              <bem.PopoverMenu__link onClick={this.saveCloneAs}>
                <i className="k-icon-clone"/>
                {t('Clone this project')}
              </bem.PopoverMenu__link>
          </ui.PopoverMenu>
        </bem.FormView__group>
      );
  },
  render () {
    var docTitle = this.state.name || t('Untitled');

    if (this.state.uid == undefined) {
      return (
        <ui.Panel>
          <bem.Loading>
            <bem.Loading__inner>
              <i />
              {t('loading...')}
            </bem.Loading__inner>
          </bem.Loading>
        </ui.Panel>
      );
    }

    return (
      <DocumentTitle title={`${docTitle} | KoboToolbox`}>
        <bem.FormView m='form'>
          <bem.FormView__row>
            <bem.FormView__cell m={['columns', 'first']}>
              <bem.FormView__cell m='label'>
                {this.state.deployment__active ? t('Current version') :
                  this.state.has_deployment ? t('Archived version') :
                    t('Draft version')}
              </bem.FormView__cell>
              <bem.FormView__cell>
                {this.renderButtons()}
              </bem.FormView__cell>
            </bem.FormView__cell>
            <bem.FormView__cell m='box'>
              {this.state.deployed_versions.length > 0 &&
                this.state.deployed_version_id != this.state.version_id && this.state.deployment__active && 
                <bem.FormView__cell m='warning'>
                  <i className="k-icon-alert" />
                  {t('If you want to make these changes public, you must deploy this form.')}
                </bem.FormView__cell>
              }
              {this.renderFormInfo()}
              {this.state.summary && this.state.summary.languages && this.state.summary.languages[0] != null && 
                this.renderFormLanguages()
              }
            </bem.FormView__cell>
          </bem.FormView__row>
          {this.state.deployed_versions.length > 0 &&
            this.renderHistory()
          }
          {this.state.deployed_versions.length > 0 && this.state.deployment__active && 
            this.renderCollectData()
          }
        </bem.FormView> 
      </DocumentTitle>
      );
  }

})

export default FormLanding;

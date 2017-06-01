_ = require('underscore')
trim = require('string.prototype.trim')

txtid = require('./model.utils').txtid
Immutable = require('immutable')
List = Immutable.List
Record = Immutable.Record

_tx_string_to_object = (translation, index)->
  out =
    name: translation
    order: index

  mtch = translation.match(/(.+)\((\w+)\)/) if translation
  if mtch
    out.name = trim(mtch[1])
    out.code = mtch[2]

  out

set_tx_id = (translation_object)->
  if not ('$uid' of translation_object)
    translation_object['$uid'] = txtid()
  translation_object

add_translation_list = (content)->
  if ('translation_list' not of content) and ('translations' of content)
    _tl = content.translations.map (translation_name, index)->
      new Record _tx_string_to_object(translation_name, index)
    content.translation_list = _tl
  else if ('translation_list' not of content)
    content.translation_list = [null]
  content

sequence_translations = (_tl)->
  # temporarily store the original order of the translation list
  for item, n in _tl
    item._index = n
  # sort by the order property
  _tl.sort (a, b)-> if a.order < b.order then -1 else 1
  # reset the order property so that it is sequential starting at 0
  for item, n in _tl
    item.order = n
  # return to the original order
  _tl.sort (a, b)-> if a._index < b._index then -1 else 1
  # remove temporary value
  for item, n in _tl
    delete item._index

prioritize_translation = (content, translation_name)->
  if 'translation_list' not of content
    throw new Error('content must have translation_list defined')
  _tl = content.translation_list
  translation_index = -1
  if _.isNumber(translation_name)
    translation_index = translation_name
  else
    for item, n in _tl
      if item.name is translation_name
        translation_index = n
        break
  if translation_index is -1
    throw new Error('translation not found')
  if translation_index > (_tl.length - 1)
    throw new Error("translation out of range: #{translation_index}")
  _tl[translation_index].order = -1
  sequence_translations(_tl)

  content


module.exports = {
  add_translation_list: add_translation_list
  set_tx_id: set_tx_id
  _tx_string_to_object: _tx_string_to_object
  prioritize_translation: prioritize_translation
}
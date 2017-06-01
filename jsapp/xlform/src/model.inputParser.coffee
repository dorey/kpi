_ = require 'underscore'
$aliases = require './model.aliases'

module.exports = do ->
  inputParser = {}

  class ParsedStruct
    constructor: (@type, @atts={})->
      @contents = []
    push: (item)->
      @contents.push(item)
      ``
    export: ->
      arr = []
      for item in @contents
        if item instanceof ParsedStruct
          item = item.export()
        arr.push(item)
      _.extend({}, @atts, {type: @type, __rows: arr})

  hasBeenParsed = (obj)->
    for row in obj
      if row.__rows
        return true
      else if $aliases.q.testGroupable(row.type)
        return false
    return true
  inputParser.hasBeenParsed = hasBeenParsed

  flatten_translated_fields = (item, translations)->
    for key, val of item
      if _.isArray(val)
        delete item[key]
        _.map(translations, (translation_obj, i)->
          _t = translation_obj.name
          _translated_val = val[i]
          if _t
            lang_str = "#{key}::#{_t}"
          else
            lang_str = key
          item[lang_str] = _translated_val
        )
    item

  parseArr = (type='survey', sArr, translations=false)->
    counts = {
      open: {}
      close: {}
    }
    count_att = (opn_cls, att)->
      counts[opn_cls][att]?=0
      counts[opn_cls][att]++
      ``
    grpStack = [new ParsedStruct(type)]

    _pushGrp = (type='group', item)->
      count_att('open', type)
      grp = new ParsedStruct(type, item)
      _curGrp().push(grp)
      grpStack.push(grp)

    _popGrp = (closedByAtts, type)->
      count_att('close', type)
      _grp = grpStack.pop()
      if _grp.type isnt closedByAtts.type
        throw new Error("mismatched group/repeat tags")
      ``

    _curGrp = ->
      _l = grpStack.length
      if _l is 0
        throw new Error("unmatched group/repeat")
      grpStack[_l-1]

    if not translations
      throw new Error('no translations')

    for item in sArr
      _groupAtts = $aliases.q.testGroupable(item.type)

      if translations and translations.length > 0
        item = flatten_translated_fields(item, translations)

      if _groupAtts
        if _groupAtts.begin
          _pushGrp(_groupAtts.type, item)
        else
          _popGrp(_groupAtts, item.type)
      else
        _curGrp().push(item)

    if grpStack.length isnt 1
      throw new Error(JSON.stringify({
          message: "unclosed groupable set",
          counts: counts 
        }))

    _curGrp().export().__rows

  inputParser.parseArr = parseArr
  inputParser.parse = (o)->
    t_list = o.translation_list
    if not t_list
      t_list = [{name: null}]

    if o.survey
      o.survey = parseArr('survey', o.survey, t_list)

    if o.choices
      o.choices = parseArr('choices', o.choices, t_list)

    # settings is sometimes packaged as an array length=1
    if o.settings and _.isArray(o.settings) and o.settings.length is 1
      o.settings = o.settings[0]

    o.translation_list = t_list
    o.translations = _.pluck(t_list, 'name')
    log(o.translation_list)
    o

  inputParser.loadChoiceLists = (passedChoices, choices)->
    tmp = {}
    choiceNames = []
    for choiceRow in passedChoices
      lName = choiceRow["list name"] || choiceRow["list_name"]
      unless tmp[lName]
        tmp[lName] = []
        choiceNames.push(lName)
      tmp[lName].push(choiceRow)
    for cn in choiceNames
      choices.add(name: cn, options: tmp[cn])

  # groupByVisibility = (inp, hidden=[], remain=[])->
  #   hiddenTypes = $aliases.q.hiddenTypes()
  #   throw Error("inputParser.sortByVisibility requires an array")  unless _.isArray(inp)
  #   for row in inp
  #     dest = if row.type? in hiddenTypes then hidden else remain
  #   [hidden, inp]

  # inputParser.sortByVisibility = sortByVisibility
  inputParser

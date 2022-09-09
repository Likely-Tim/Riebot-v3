const {MessageActionRow, MessageButton, MessageSelectMenu} = require("discord.js");

const nextButton = new MessageButton().setCustomId("next").setStyle("SECONDARY").setEmoji("➡️");
const prevButton = new MessageButton().setCustomId("prev").setStyle("SECONDARY").setEmoji("⬅️");
const checkButton = new MessageButton().setCustomId("save").setStyle("SECONDARY").setEmoji("✅");
const refreshButton = new MessageButton().setCustomId("refresh").setStyle("SECONDARY").setEmoji("🔄");
const searchButton = new MessageButton().setCustomId("search").setStyle("PRIMARY").setLabel("Search");
const anilistButton = new MessageButton().setCustomId("anilist").setLabel("Anilist").setStyle("PRIMARY");
const malButton = new MessageButton().setCustomId("mal").setLabel("MAL").setStyle("PRIMARY");
const characterButton = new MessageButton().setCustomId("characters").setLabel("Characters").setStyle("PRIMARY");
const vaButton = new MessageButton().setCustomId("va").setLabel("temp").setStyle("SECONDARY");
const showButton = new MessageButton().setCustomId("show").setLabel("temp").setStyle("PRIMARY");
const opSongsButton = new MessageButton().setCustomId("opSongs").setLabel("OP").setStyle("PRIMARY");
const edSongsButton = new MessageButton().setCustomId("edSongs").setLabel("ED").setStyle("PRIMARY");
const scoreButton = new MessageButton().setCustomId("score").setLabel("Score").setStyle("PRIMARY");
const opEdSongsButton = new MessageButton().setCustomId("opEdSongs").setLabel("OP & ED").setStyle("PRIMARY");
const disabledNextButton = new MessageButton().setCustomId("disabled_next").setStyle("SECONDARY").setEmoji("➡️").setDisabled(true);
const disabledPrevButton = new MessageButton().setCustomId("disabled_prev").setStyle("SECONDARY").setEmoji("⬅️").setDisabled(true);
const disabledCheckButton = new MessageButton().setCustomId("disabled_save").setStyle("SECONDARY").setEmoji("✅").setDisabled(true);
const disabledRefreshButton = new MessageButton().setCustomId("disabled_refresh").setStyle("SECONDARY").setEmoji("🔄").setDisabled(true);
const disabledSearchButton = new MessageButton().setCustomId("disabled_search").setStyle("PRIMARY").setLabel("Search").setDisabled(true);

const buttons = {};
buttons.prev = prevButton;
buttons.next = nextButton;
buttons.check = checkButton;
buttons.refresh = refreshButton;
buttons.search = searchButton;
buttons.anilist = anilistButton;
buttons.mal = malButton;
buttons.characters = characterButton;
buttons.va = vaButton;
buttons.show = showButton;
buttons.opSongs = opSongsButton;
buttons.edSongs = edSongsButton;
buttons.score = scoreButton;
buttons.opEdSongs = opEdSongsButton;
buttons.disabled_prev = disabledPrevButton;
buttons.disabled_next = disabledNextButton;
buttons.disabled_check = disabledCheckButton;
buttons.disabled_refresh = disabledRefreshButton;
buttons.disabled_search = disabledSearchButton;

// Takes an array of button names and returns a MessageActionRow
function actionRow(input) {
  const row = new MessageActionRow();
  for (let i = 0; i < input.length; i++) {
    row.addComponents(buttons[input[i]]);
  }
  return row;
}

// Takes an array of button names and buttons and returns a MessageActionRow
function merge(input) {
  const row = new MessageActionRow();
  for (let i = 0; i < input.length; i++) {
    const value = input[i];
    if (typeof value === "string") {
      row.addComponents(buttons[value]);
    } else {
      row.addComponents(value);
    }
  }
  return row;
}

// Takes a MessageActionRow and replaces a button
function replace(input, replace, replacement) {
  for (let i = 0; i < input.components.length; i++) {
    if (input.components[i].customId == replace) {
      input.components[i] = buttons[replacement];
      break;
    }
  }
  return input;
}

function changeLabel(button, label) {
  button.label = label;
  return button;
}

function returnButton(input) {
  return buttons[input];
}

function linkButton(url) {
  const button = new MessageButton().setLabel("Trailer").setStyle("LINK").setURL(url);
  return button;
}

// Takes an array and create a select menu
function addSelect(options) {
  if (options == undefined) {
    return;
  }
  const row = new MessageActionRow();
  const select = new MessageSelectMenu().setCustomId("select").setPlaceholder("Nothing selected");
  const optionObject = [];
  for (let i = 0; i < options.length; i++) {
    const object = {};
    const option = options[i];
    object.label = option;
    object.value = option;
    optionObject.push(object);
  }
  if (optionObject.length != 0) {
    select.addOptions(optionObject);
    row.addComponents(select);
    return row;
  }
}

function addSelectObject(object) {
  const row = new MessageActionRow();
  const select = new MessageSelectMenu().setCustomId("select").setPlaceholder("Nothing selected");
  let optionObject = [];
  for (let key in object) {
    let option = {};
    option.label = key;
    option.value = String(object[key]);
    optionObject.push(option);
  }
  select.addOptions(optionObject);
  row.addComponents(select);
  return row;
}

// Disables all buttons in a MessageActionRow Array except Links
function disableAllButtons(input) {
  if (!input) {
    return [];
  }
  for (let j = 0; j < input.length; j++) {
    const actionRow = input[j];
    for (let i = 0; i < actionRow.components.length; i++) {
      if (actionRow.components[i].style != "LINK") {
        actionRow.components[i].disabled = true;
      }
    }
  }
  return input;
}

// Takes a MessageSelectMenu and makes an option default
function setDefault(input, name) {
  const options = input.options;
  for (let i = 0; i < options.length; i++) {
    if (options[i].default) {
      options[i].default = false;
    }
    if (options[i].label == name) {
      options[i].default = true;
    }
  }
}

// Enables all buttons in a MessageActionRow except one button
function enableAllButOne(messageActionRow, disableCustomId) {
  const components = messageActionRow.components;
  for (let i = 0; i < components.length; i++) {
    if (components[i].customId == disableCustomId) {
      components[i].disabled = true;
    } else {
      components[i].disabled = false;
    }
  }
  messageActionRow.components = components;
  return messageActionRow;
}

module.exports.disableAllButtons = disableAllButtons;
module.exports.linkButton = linkButton;
module.exports.addSelect = addSelect;
module.exports.returnButton = returnButton;
module.exports.actionRow = actionRow;
module.exports.merge = merge;
module.exports.replace = replace;
module.exports.changeLabel = changeLabel;
module.exports.setDefault = setDefault;
module.exports.enableAllButOne = enableAllButOne;
module.exports.addSelectObject = addSelectObject;

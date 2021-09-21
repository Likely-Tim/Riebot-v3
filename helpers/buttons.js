const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');

const next_button = new MessageButton().setCustomId('next').setStyle('SECONDARY').setEmoji("➡️");
const prev_button = new MessageButton().setCustomId('prev').setStyle('SECONDARY').setEmoji("⬅️");
const check_button = new MessageButton().setCustomId('save').setStyle('SECONDARY').setEmoji("✅");
const refresh_button = new MessageButton().setCustomId('refresh').setStyle('SECONDARY').setEmoji("🔄");
const search_button = new MessageButton().setCustomId('search').setStyle('PRIMARY').setLabel("Search");
const anilist_button = new MessageButton().setCustomId('anilist').setLabel("Anilist").setStyle('PRIMARY');
const mal_button = new MessageButton().setCustomId('mal').setLabel("MAL").setStyle('PRIMARY');
const characters_button = new MessageButton().setCustomId('characters').setLabel("Characters").setStyle('PRIMARY');
const va_button = new MessageButton().setCustomId('va').setLabel("temp").setStyle('SECONDARY');
const disabled_next_button = new MessageButton().setCustomId('disabled_next').setStyle('SECONDARY').setEmoji("➡️").setDisabled(true);
const disabled_prev_button = new MessageButton().setCustomId('disabled_prev').setStyle('SECONDARY').setEmoji("⬅️").setDisabled(true);
const disabled_check_button = new MessageButton().setCustomId('disabled_save').setStyle('SECONDARY').setEmoji("✅").setDisabled(true);
const disabled_refresh_button = new MessageButton().setCustomId('disabled_refresh').setStyle('SECONDARY').setEmoji("🔄").setDisabled(true);
const disabled_search_button = new MessageButton().setCustomId('disabled_search').setStyle('PRIMARY').setLabel("Search").setDisabled(true);

let buttons = {};
buttons.prev = prev_button;
buttons.next = next_button;
buttons.check = check_button;
buttons.refresh = refresh_button;
buttons.search = search_button;
buttons.anilist = anilist_button;
buttons.mal = mal_button;
buttons.characters = characters_button;
buttons.va = va_button;
buttons.disabled_prev = disabled_prev_button;
buttons.disabled_next = disabled_next_button;
buttons.disabled_check = disabled_check_button;
buttons.disabled_refresh = disabled_refresh_button;
buttons.disabled_search = disabled_search_button;

// Takes an array of button names and returns a MessageActionRow
function action_row(input) {
  let row = new MessageActionRow();
  for(let i = 0; i < input.length; i++) {
    row.addComponents(buttons[input[i]]);
  }
  return row;
}

// Takes an array of button names and buttons and returns a MessageActionRow
function merge(input) {
  let row = new MessageActionRow();
  for(let i = 0; i < input.length; i++) {
    let value = input[i];
    if(typeof value == "string") {
      row.addComponents(buttons[value]);
    } else {
      row.addComponents(value);
    }
  }
  return row;
}

// Takes a MessageActionRow and replaces a button
function replace(input, replace, replacement) {
  for(let i = 0; i < input.components.length; i++) {
    if(input.components[i].customId == replace) {
      input.components[i] = buttons[replacement];
      break;
    }
  }
  return input;
}

function change_label(button, label) {
  button.label = label;
  return button;
}

function return_button(input) {
  return buttons[input];
}

function link_button(url) {
  let button = new MessageButton().setLabel("Trailer").setStyle("LINK").setURL(url);
  return button;
}

function add_select(options) {
  let row = new MessageActionRow();
  let select = new MessageSelectMenu().setCustomId("select").setPlaceholder("Nothing selected");
  let option_object = [];
  options = sanitize_input(options);
  let existing_values = new Set();
  let existing_song = new Set();
  for(let i = 0; i < options.length; i++) {
    let option = options[i];
    if(!existing_values.has(option)) {
      existing_values.add(option);
      let object = {};
      object.label = option;
      object.value = option;
      option_object.push(object);
    }
    
  }
  if(option_object.length == 0) {
    return;
  } else {
    select.addOptions(option_object);
    row.addComponents(select);
    return row;
  }
}

function sanitize_input(options) {
  let remove_index = [];
  for(let i = 0; i < options.length; i++) {
    let option = options[i];
    if(option == "" || option == "N/A") {
      remove_index.unshift(i);
      continue;
    }
    option = option.replace(/#[A-Z]*[0-9]*: /, "");
    option = option.replace(/\((eps|ep) ([0-9]+-[0-9]+|[0-9]+)(,+ +([0-9]+|[0-9]+-[0-9]+))*\)/, "");
    options[i] = option;
  }
  for(let i = 0; i < remove_index.length; i++) {
    options.splice(remove_index[i], 1);
  }
  remove_index = [];
  let songs = [];
  for(let i = 0; i < options.length; i++) {
    let song = options[i].match(/".*"/).toString();
    if(songs.includes(song)) {
      options[songs.indexOf(song)] = song;
      remove_index.unshift(i);
    } else {
      songs.push(song);
    }
  }
  for(let i = 0; i < remove_index.length; i++) {
    options.splice(remove_index[i], 1);
  }
  for(let i = 0; i < options.length; i++) {
    let option = options[i];
    if(option.length > 100) {
      options[i] = option.match(/".*"/).toString();
    }
  }
  options = options.splice(0, 25);
  return options;
}

// Disables all buttons in a MessageActionRow
function disable_all_buttons(input) {
  for(let i = 0; i < input.components.length; i++) {
    input.components[i].disabled = true;
  }
  return input;
}

module.exports.disable_all_buttons = disable_all_buttons;
module.exports.link_button = link_button;
module.exports.add_select = add_select;
module.exports.return_button = return_button;
module.exports.action_row = action_row;
module.exports.merge = merge;
module.exports.replace = replace;
module.exports.change_label = change_label;
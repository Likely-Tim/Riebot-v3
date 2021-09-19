const { MessageActionRow, MessageButton } = require('discord.js');

const next_button = new MessageButton().setCustomId('next').setStyle('SECONDARY').setEmoji("➡️");
const prev_button = new MessageButton().setCustomId('prev').setStyle('SECONDARY').setEmoji("⬅️");
const check_button = new MessageButton().setCustomId('save').setStyle('SECONDARY').setEmoji("✅");
const disabled_next_button = new MessageButton().setCustomId('next').setStyle('SECONDARY').setEmoji("➡️").setDisabled(true);
const disabled_prev_button = new MessageButton().setCustomId('prev').setStyle('SECONDARY').setEmoji("⬅️").setDisabled(true);
const disabled_check_button = new MessageButton().setCustomId('save').setStyle('SECONDARY').setEmoji("✅").setDisabled(true);
const refresh_button = new MessageButton().setCustomId('refresh').setStyle('SECONDARY').setEmoji("🔄");
const disabled_refresh_button = new MessageButton().setCustomId('refresh').setStyle('SECONDARY').setEmoji("🔄").setDisabled(true);

let buttons = {};
buttons.prev = prev_button;
buttons.next = next_button;
buttons.check = check_button;
buttons.refresh = refresh_button;
buttons.disabled_prev = disabled_prev_button;
buttons.disabled_next = disabled_next_button;
buttons.disabled_check = disabled_check_button;
buttons.disabled_refresh = disabled_refresh_button;

function add_buttons(input) {
  let row = new MessageActionRow();
  for(let i = 0; i < input.length; i++) {
    row.addComponents(buttons[input[i]]);
  }
  return row;
}

// Disables all buttons in a MessageActionRow
function disable_all_buttons(input) {
  for(let i = 0; i < input.components.length; i++) {
    input.components[i].disabled = true;
  }
  return input;
}

module.exports.disable_all_buttons = disable_all_buttons;
module.exports.add_buttons = add_buttons;
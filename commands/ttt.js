const { SlashCommandBuilder } = require('@discordjs/builders');
const { InteractionCollector } = require('discord.js');
const Keyv = require('keyv');
const { KeyvFile } = require('keyv-file');
const button = require('../helpers/ttt_buttons.js');

const db = new Keyv({
  store: new KeyvFile({
    filename: `storage/ttt.json`,
    encode: JSON.stringify,
    decode: JSON.parse
  })
});

const messages = new Keyv({
  store: new KeyvFile({
    filename: `storage/messages.json`,
    encode: JSON.stringify,
    decode: JSON.parse
  })
});

async function game_start(player_1, player_2) {
  db.set("game_in_progress", "true");
  db.set("player_1", player_1);
  db.set("player_2", player_2);
  db.set("player_1_turn", true);
  let board = button.board_create();
  db.set("board", board);
  return board;
}

async function game_end(client) {
  db.set("game_in_progress", "false");
  let channelId = await messages.get('ttt_channel_id');
  let messageId = await messages.get('ttt_message_id');
  let channel = await client.channels.fetch(channelId);
  let message = await channel.messages.fetch(messageId);
  await message.unpin();
}

async function save_message(new_message) {
  await messages.set(`ttt_channel_id`, new_message.channelId);
  await messages.set(`ttt_message_id`, new_message.id);
}

module.exports = {
  data: new SlashCommandBuilder()
		.setName('ttt')
 		.setDescription('Tic Tac Toe')
    .addUserOption(option => option.setName('user').setDescription('Challenge')),

 	async execute(client, interaction) {
    let challenged = interaction.options.getUser("user");
    let in_progress = await db.get("game_in_progress");
    if(in_progress == undefined) {
      in_progress = "false";
      db.set("game_in_progress", "false");
    }
    if(in_progress == "false" && challenged == null) {
      interaction.reply({content: "Challenge someone."});
      return;
    }
    if(in_progress == "false") {
      if(challenged == null) {
        interaction.reply({content: "Challenge someone."});
        return;
      } else {
        if(challenged.bot) {
          interaction.reply({content: "Leave the bots alone"});
          return;
        }
        // if(interaction.user.id == challenged.id) {
        //   interaction.reply({content: "Can't play against yourself"});
        //   return;
        // }
        let board = await game_start(interaction.user.id, challenged.id);
        await interaction.reply({content: `**<@${interaction.user.id}> vs <@${challenged.id}>**`, components: board});
        const message = await interaction.fetchReply();
        message.pin();
        save_message(message);
        ttt_button_interaction(client, message);
      }
    } else {
      interaction.reply({content: "Game In Progress."});
      return;
    }
	},
};

function ttt_button_interaction(client, message) {
  let collector = new InteractionCollector(client, {message: message, componentType: "BUTTON"});
  collector.on("collect", async press => {
    let turn = await db.get("player_1_turn");
    let player;
    if(turn) {
      player = await db.get("player_1");
    } else {
      player = await db.get("player_2");
    }
    if(press.user.id != player) {
      await press.reply({content: `**<@${player}>'s turn**`, ephemeral: true});
      return;
    }
    db.set("player_1_turn", !turn);
    let board = button.update_board(press.customId, press.message.components, turn);
    if(button.check_win(board, turn)) {
      game_end(client);
      board = button.disable_all_buttons(board);
      await press.update({content: `**<@${player}> wins**`, components: board});
      return;
    }
    if(button.finished(board)) {
      game_end(client);
      await press.update({content: `**Draw**`, components: board});
      return;
    }
    db.set("board", board);
    await press.update({ components: board });
  });
}

module.exports.ttt_button_interaction = ttt_button_interaction;
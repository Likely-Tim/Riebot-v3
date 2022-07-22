const {SlashCommandBuilder} = require('@discordjs/builders');
const {InteractionCollector} = require('discord.js');
const Keyv = require('keyv');
const {KeyvFile} = require('keyv-file');
const button = require('../helpers/ttt_buttons.js');

const db = new Keyv({
  store: new KeyvFile({
    filename: 'storage/ttt.json',
    encode: JSON.stringify,
    decode: JSON.parse,
  }),
});

const messages = new Keyv({
  store: new KeyvFile({
    filename: 'storage/messages.json',
    encode: JSON.stringify,
    decode: JSON.parse,
  }),
});

async function gameStart(playerOne, playerTwo) {
  db.set('game_inProgress', 'true');
  db.set('playerOne', playerOne);
  db.set('playerTwo', playerTwo);
  db.set('playerOne_turn', true);
  const board = button.boardCreate();
  db.set('board', board);
  return board;
}

async function gameEnd(client) {
  db.set('game_inProgress', 'false');
  const channelId = await messages.get('ttt_channelId');
  const messageId = await messages.get('ttt_message_id');
  const channel = await client.channels.fetch(channelId);
  const message = await channel.messages.fetch(messageId);
  await message.unpin();
}

async function saveMessage(newMessage) {
  await messages.set('ttt_channelId', newMessage.channelId);
  await messages.set('ttt_message_id', newMessage.id);
}

module.exports = {
  data: new SlashCommandBuilder()
      .setName('ttt')
      .setDescription('Tic Tac Toe')
      .addUserOption((option) => option.setName('user').setDescription('Challenge')),

  async execute(client, interaction) {
    const challenged = interaction.options.getUser('user');
    let inProgress = await db.get('game_inProgress');
    if (inProgress == undefined) {
      inProgress = 'false';
      db.set('game_inProgress', 'false');
    }
    if (inProgress == 'false' && challenged == null) {
      interaction.reply({content: 'Challenge someone.'});
      return;
    }
    if (inProgress == 'false') {
      if (challenged == null) {
        interaction.reply({content: 'Challenge someone.'});
      } else {
        if (challenged.bot) {
          interaction.reply({content: 'Leave the bots alone'});
          return;
        }
        // if(interaction.user.id == challenged.id) {
        //   interaction.reply({content: "Can't play against yourself"});
        //   return;
        // }
        const board = await gameStart(interaction.user.id, challenged.id);
        await interaction.reply({content: `**<@${interaction.user.id}> vs <@${challenged.id}>**`, components: board});
        const message = await interaction.fetchReply();
        message.pin();
        saveMessage(message);
        tttButtonInteraction(client, message);
      }
    } else {
      interaction.reply({content: 'Game In Progress.'});
    }
  },
};

function tttButtonInteraction(client, message) {
  const collector = new InteractionCollector(client, {message, componentType: 'BUTTON'});
  collector.on('collect', async (press) => {
    const turn = await db.get('playerOne_turn');
    let player;
    if (turn) {
      player = await db.get('playerOne');
    } else {
      player = await db.get('playerTwo');
    }
    if (press.user.id != player) {
      await press.reply({content: `**<@${player}>'s turn**`, ephemeral: true});
      return;
    }
    db.set('playerOne_turn', !turn);
    let board = button.updateBoard(press.customId, press.message.components, turn);
    if (button.checkWin(board, turn)) {
      gameEnd(client);
      board = button.disableAllButtons(board);
      await press.update({content: `**<@${player}> wins**`, components: board});
      return;
    }
    if (button.finished(board)) {
      gameEnd(client);
      await press.update({content: '**Draw**', components: board});
      return;
    }
    db.set('board', board);
    await press.update({components: board});
  });
}

module.exports.tttButtonInteraction = tttButtonInteraction;

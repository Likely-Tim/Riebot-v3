const { MessageActionRow, MessageButton } = require('discord.js');

function board_create(table) {
  let board = [];
  for(let i = 0; i < 3; i++) {
    let row = new MessageActionRow();
    for(let j = 0; j < 3; j++) {
      let button = new MessageButton().setCustomId((i * 3 + j).toString()).setStyle('SECONDARY').setLabel(' ');
      row.addComponents(button);
    }
    board.push(row);
  }
  return board;
}

function update_board(id, board, turn) {
  let mark = '❌';
  if(!turn) {
    mark = '⭕';
  }
  let i = parseInt(id / 3);
  let j = id % 3;
  let button = board[i].components[j];
  button.label = null;
  button.emoji = { id: undefined, name: mark, animated: undefined };
  button.disabled = true;
  board[i].components[j] = button;
  return board;
}

function check_win(board, turn) {
  let mark = 'x';
  if(!turn) {
    mark = 'o';
  }
  let board_array = [];
  for(let i = 0; i < 3; i++) {
    let row = [];
    for(let j = 0; j < 3; j++) {
      let symbol = board[i].components[j].emoji;
      if(symbol == null) {
        row.push('*');
      } else {
        symbol = symbol.name;
        if(symbol == '⭕') {
          row.push('o');
        } else {
          row.push('x');
        }
      }
    }
    board_array.push(row);
  }
  for(let i = 0; i < 3; i++) {
    for(let j = 0; j < 3; j++) {
      if(board_array[i][j] != mark) {
        break;
      }
      if(j == 2) {
        return true;
      }
    }
  }
  for(let i = 0; i < 3; i++) {
    for(let j = 0; j < 3; j++) {
      if(board_array[j][i] != mark) {
        break;
      } 
      if(j == 2) {
        return true;
      }
    }
  }
  for(let i = 0; i < 3; i++) {
    if(board_array[i][i] != mark) {
      break;
    }
    if(i == 2) {
      return true;
    }
  }
  for(let i = 0; i < 3; i++) {
    if(board_array[i][2 - i] != mark) {
      break;
    }
    if(i == 2) {
      return true;
    }
  }
  return false;
}

function disable_all_buttons(input) {
  for(let j = 0; j < input.length; j++) {
    let action_row = input[j];
    for(let i = 0; i < action_row.components.length; i++) {
      action_row.components[i].disabled = true;
    }
  }
  return input;
}

function finished(input) {
  for(let i = 0; i < 3; i++) {
    for(let j = 0; j < 3; j++) {
      if(input[i].components[j].disabled != true) {
        return false;
      }
    }
  }
  return true;
}

module.exports.board_create = board_create;
module.exports.update_board = update_board;
module.exports.check_win = check_win;
module.exports.disable_all_buttons = disable_all_buttons;
module.exports.finished = finished;
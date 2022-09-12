const { MessageActionRow, MessageButton } = require("discord.js");

function boardCreate() {
  const board = [];
  for (let i = 0; i < 3; i++) {
    const row = new MessageActionRow();
    for (let j = 0; j < 3; j++) {
      const button = new MessageButton()
        .setCustomId((i * 3 + j).toString())
        .setStyle("SECONDARY")
        .setLabel(" ");
      row.addComponents(button);
    }
    board.push(row);
  }
  return board;
}

function updateBoard(id, board, turn) {
  let mark = "❌";
  if (!turn) {
    mark = "⭕";
  }
  const i = parseInt(id / 3);
  const j = id % 3;
  const button = board[i].components[j];
  button.label = null;
  button.emoji = { id: undefined, name: mark, animated: undefined };
  button.disabled = true;
  board[i].components[j] = button;
  return board;
}

function checkWin(board, turn) {
  let mark = "x";
  if (!turn) {
    mark = "o";
  }
  const boardArray = [];
  for (let i = 0; i < 3; i++) {
    const row = [];
    for (let j = 0; j < 3; j++) {
      let symbol = board[i].components[j].emoji;
      if (symbol == null) {
        row.push("*");
      } else {
        symbol = symbol.name;
        if (symbol == "⭕") {
          row.push("o");
        } else {
          row.push("x");
        }
      }
    }
    boardArray.push(row);
  }
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (boardArray[i][j] != mark) {
        break;
      }
      if (j == 2) {
        return true;
      }
    }
  }
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (boardArray[j][i] != mark) {
        break;
      }
      if (j == 2) {
        return true;
      }
    }
  }
  for (let i = 0; i < 3; i++) {
    if (boardArray[i][i] != mark) {
      break;
    }
    if (i == 2) {
      return true;
    }
  }
  for (let i = 0; i < 3; i++) {
    if (boardArray[i][2 - i] != mark) {
      break;
    }
    if (i == 2) {
      return true;
    }
  }
  return false;
}

function disableAllButtons(input) {
  for (let j = 0; j < input.length; j++) {
    const actionRow = input[j];
    for (let i = 0; i < actionRow.components.length; i++) {
      actionRow.components[i].disabled = true;
    }
  }
  return input;
}

function finished(input) {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (input[i].components[j].disabled != true) {
        return false;
      }
    }
  }
  return true;
}

module.exports.boardCreate = boardCreate;
module.exports.updateBoard = updateBoard;
module.exports.checkWin = checkWin;
module.exports.disableAllButtons = disableAllButtons;
module.exports.finished = finished;

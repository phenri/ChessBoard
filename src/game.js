function withCallListeners(callable, isUndo) {
  return function(move) {
    if(!_.all(this.moveCheckers, function(moveChecker) {
      return moveChecker(move, isUndo);
    })) return false;
    var return_value = callable.apply(this, arguments);
    if(return_value) _.each(this.listeners, function(listener) {
      listener(return_value);
    });
    return return_value;
  }
}

function ChessGame() {
  this.chessBoard = new ChessBoard();
  this.notationProcessor = new NotationProcessor(this.chessBoard);
  this.listeners = [];
  this.moveCheckers = [];
  this.boardString = this.chessBoard.boardString.bind(this.chessBoard);
  this.parseAlgebraicMove = this.notationProcessor.parseAlgebraicMove.bind(this.notationProcessor);
  this.isLegalMove = this.chessBoard.isLegalMove.bind(this.chessBoard);
  this.getLegalMovesRaw = this.chessBoard.getLegalMovesRaw.bind(this.chessBoard);
}

ChessGame.prototype = {
  makeMoveFromAlgebraic: function(algebraicMove) {
    return this.tryToMakeMove(
      this.notationProcessor.parseAlgebraicMove(algebraicMove)
    );
  },
  makeMoveFromUCI: function(uciMove) {
    return this.tryToMakeMove(
      this.notationProcessor.parseUCIMove(uciMove)
    );
  },
  makeMoveFromIndices: function(sourceIndex, destIndex, promotion) {
    return this.tryToMakeMove(
      new Move(sourceIndex, destIndex, this.chessBoard, promotion)
    );
  },
  tryToMakeMove: withCallListeners(function(move) {
    try {
      this.chessBoard.makeLegalMove(move);
    } catch(err) {
      return null;
    }
    return move;
  }),
  getPiece: function(squareIndex) { return this.chessBoard.getPieceRaw(squareIndex); },
  addListener: function(callable) {
    this.listeners.push(callable);
  },
  addMoveChecker: function(callable) {
    this.moveCheckers.push(callable);
  },
  gameState: function() {
    return this.chessBoard.slice(0);
  },
  undoLastMove: withCallListeners(
    function() {
      return this.chessBoard.undoLastMove();
    }, true),
  undoToMove: withCallListeners(
    function(move) {
      return this.chessBoard.undoToMove(move);
    }, true)
}

ChessGame.prototype.makeMoveFromRankFile = rawToRankFileSrcDst(
  ChessGame.prototype.makeMoveFromIndices
);

ChessGame.prototype.__defineGetter__('movesList', function() {
  return this.chessBoard.moves;
});

angular.module('ChessGame').factory('ChessGame', function() { return ChessGame; });

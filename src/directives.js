function segment(incoming, length) {
  var output = [];
  var current = [];
  _.each(incoming, function(element) {
    current.push(element);
    if(current.length < length) return;
    output.push(current);
    current = [];
  });
  if(current.length > 0) output.push(current);
  return output;
}

var pieceNameToCharacter = {
  k: "♔",
  K: "♚",
  q: "♕",
  Q: "♛",
  r: "♖",
  R: "♜",
  n: "♘",
  N: "♞",
  b: "♗",
  B: "♝",
  p: "♙",
  P: "♟"
}

angular.module('ChessGame').directive('chessBoard', function () {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      chessGame: "=chessGame",
      squareSize: "=squareSize",
      lightColor: "=lightColor",
      darkColor: "=darkColor"
    },
    templateUrl: "board.html",
    link: function (scope, element, attrs) {
      scope.style = {
        width: (8 * scope.squareSize) + "px",
        height: (8 * scope.squareSize) + "px",
        position: "relative",
      }
      var chessGame = scope.chessGame;
      var Square = function (index, chessGame) {
        this.index = index;
        this.chessGame = chessGame;
        this.highlightColor = null;
      }
      Square.prototype = {
        size: scope.squareSize,
        lightColor: scope.lightColor,
        darkColor: scope.darkColor,
      }
      Square.prototype.__defineGetter__('piece', function() {
        return this.chessGame.getPiece(this.index);
      })
      Square.prototype.__defineGetter__('pieceCharacter', function() {
        if (this.piece) return pieceNameToCharacter[this.piece.getName()];
      });
      Square.prototype.__defineGetter__('rank', function () {
        return rankFromRaw(this.index);
      });
      Square.prototype.__defineGetter__('file', function () {
        return fileFromRaw(this.index);
      });
      Square.prototype.__defineGetter__('hasPiece', function () {
        return chessGame.getPiece(this.index).isEmpty;
      });
      Square.prototype.__defineGetter__('xPosition', function () {
        return this.file * this.size;
      });
      Square.prototype.__defineGetter__('yPosition', function () {
        return (7 - this.rank) * this.size;
      });
      Square.prototype.__defineGetter__('color', function () {
        return (this.rank & 0x1) == (this.file & 0x1) ?
          this.darkColor : this.lightColor;
      });
      Square.prototype.__defineGetter__('style', function() {
        return {
          width: this.size + "px",
          height: this.size + "px",
          background: this.highlightColor ? this.highlightColor : this.color,
          position: "absolute",
          left: this.xPosition + "px",
          top: this.yPosition + "px"
        }
      });
      scope.squareSet = {
        squares: _.map(_.range(64), function(squareIndex) {
          return new Square(squareIndex, chessGame);
        }),
        clearHighlights: function() {
          _.each(this.squares, function(square) {
            square.highlightColor = null;
          });
        },
        setHighlight: function(index, highlightColor) {
          this.squares[index].highlightColor = highlightColor;
        },
        setNewHighlight: function() {
          this.clearHighlights();
          this.setHighlight.apply(this, arguments);
        }
      }
      scope.chessGame.addListener(scope.$apply.bind(scope));
    }
  }
}).directive('chessSquare', function () {
  return {
    restrict: 'E',
    replace: true,
    scope: {square: "=square"},
    templateUrl: "square.html",
    link: function (scope, element, attrs) {
      element.droppable({
        accept: function(draggable) {
          pieceScope = angular.element(draggable).scope();
          return scope.square.chessGame.isLegalMove(pieceScope.square.index,
                                                    scope.square.index);

        },
        drop: function(event, ui) {
          pieceScope = angular.element(event.toElement || event.relatedTarget).scope()
          console.log(pieceScope.square.piece);
          console.log(pieceScope.square.piece instanceof Pawn);
          if (pieceScope.square.piece instanceof Pawn && (scope.square.rank == 0 || scope.square.rank == 7)) {
            
          }
          
          if (scope.square.chessGame.makeMoveFromIndices(pieceScope.square.index,
                                                         scope.square.index)) {
            scope.$apply();
            pieceScope.$apply();
          }
        }
      })
    }
  }
}).directive('chessPiece', function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      square: "=square"
    },
    templateUrl: 'piece.html',
    link: function (scope, element, attrs) {
      scope.topOffset = function() {
        return -scope.square.size * 1/4;
      }
      scope.style = {
        "font-size": scope.square.size + "px",
        position: "relative",
        top: scope.topOffset() + "px",
        cursor: "pointer"
      }
      element.draggable({zIndex: 999999})
      element.draggable({
        disable: false,
        revert: "invalid",
      }).draggable({
        start: function(event, ui) {
        },
        stop: function(event, ui) {
          element.css("top", scope.topOffset() + "px");
          element.css("left", "0px");
        },
        drag: function(event, ui) {
        },
        deactivate: function(event, ui) {
        }
      });
    }
  }
}).directive('moveList', function() {
  function moveListController($scope, $attrs) {
    $scope.rewindTo = function(move) {
      if(move.algebraic === "...") return;
      this.chessGame.undoToMove(move);
    }
    $scope.updateMovePairs = function() {
      var moveList = $scope.chessGame.chessBoard.moves.slice(0);
      moveList.push({algebraic: "..."});
      $scope.movePairs = segment(moveList, 2);
    }
    $scope.chessGame.addListener($scope.updateMovePairs);
    $scope.updateMovePairs();
  }
  return {
    restrict: 'E',
    replace: true,
    templateUrl: "move_table.html",
    controller: moveListController
  }
});
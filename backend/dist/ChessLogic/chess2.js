"use strict";
// type Square = {
//     piece: number ;
//     blocking: [number, number][];
//     canCome: [number, number][];
//     canGoTo: [number, number][];
//     rays: [number, number, number][];
// }
// class Chess {
//     private board: Square[][]  = [
//         [//row:0
//             /*0*/{ piece: 1, blocking: [],      canGoTo: [],            canCome: [], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*1*/{ piece: 2, blocking: [[0,0]], canGoTo: [[2,0],[2,2]], canCome: [], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*2*/{ piece: 3, blocking: [[0,3]], canGoTo: [],            canCome: [], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*3*/{ piece: 4, blocking: [[0,4]], canGoTo: [],            canCome: [], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*4*/{ piece: 5, blocking: [[0,3]], canGoTo: [],            canCome: [], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*5*/{ piece: 3, blocking: [[0,4]], canGoTo: [],            canCome: [], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*6*/{ piece: 2, blocking: [[0,7]], canGoTo: [[2,5],[2,7]], canCome: [], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*7*/{ piece: 1, blocking: [],      canGoTo: [],            canCome: [], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//         ],
//         [//row:1
//             /*0*/{ piece: 0, blocking: [[0,0]],                   canGoTo: [[2,0],[3,0]], canCome: [], rays: [[0,0,0],[0,0,0],[1,2,1]]},
//             /*1*/{ piece: 0, blocking: [[0,2]],                   canGoTo: [[2,1],[3,1]], canCome: [], rays: [[0,0,0],[0,0,0],[1,2,1]]},
//             /*2*/{ piece: 0, blocking: [[0,3]],                   canGoTo: [[2,2],[3,2]], canCome: [], rays: [[0,0,0],[0,0,0],[1,2,1]]},
//             /*3*/{ piece: 0, blocking: [[0,1],[0,2],[0,3],[0,4]], canGoTo: [[2,3],[3,3]], canCome: [], rays: [[0,0,0],[0,0,0],[1,2,1]]},
//             /*4*/{ piece: 0, blocking: [[0,3],[0,4],[0,5],[0,6]], canGoTo: [[2,4],[3,4]], canCome: [], rays: [[0,0,0],[0,0,0],[1,2,1]]},
//             /*5*/{ piece: 0, blocking: [[0,4]],                   canGoTo: [[2,5],[3,5]], canCome: [], rays: [[0,0,0],[0,0,0],[1,2,1]]},
//             /*6*/{ piece: 0, blocking: [[0,5]],                   canGoTo: [[2,6],[3,6]], canCome: [], rays: [[0,0,0],[0,0,0],[1,2,1]]},
//             /*7*/{ piece: 0, blocking: [[0,7]],                   canGoTo: [[2,7],[3,7]], canCome: [], rays: [[0,0,0],[0,0,0],[1,2,1]]},
//         ],
//         [//row:2
//             /*0*/{piece: -1, blocking: [], canGoTo: [], canCome: [[0, 6]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*1*/{piece: -1, blocking: [], canGoTo: [], canCome: [[1, 6]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*2*/{piece: -1, blocking: [], canGoTo: [], canCome: [[2, 6]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*3*/{piece: -1, blocking: [], canGoTo: [], canCome: [[3, 6]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*4*/{piece: -1, blocking: [], canGoTo: [], canCome: [[4, 6]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*5*/{piece: -1, blocking: [], canGoTo: [], canCome: [[5, 6]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*6*/{piece: -1, blocking: [], canGoTo: [], canCome: [[6, 6]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*7*/{piece: -1, blocking: [], canGoTo: [], canCome: [[7, 6]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//         ],
//         [//row:3
//             /*0*/{piece: -1, blocking: [], canGoTo: [], canCome: [[0,6]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*1*/{piece: -1, blocking: [], canGoTo: [], canCome: [[1,6]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*2*/{piece: -1, blocking: [], canGoTo: [], canCome: [[2,6]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*3*/{piece: -1, blocking: [], canGoTo: [], canCome: [[3,6]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*4*/{piece: -1, blocking: [], canGoTo: [], canCome: [[4,6]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*5*/{piece: -1, blocking: [], canGoTo: [], canCome: [[5,6]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*6*/{piece: -1, blocking: [], canGoTo: [], canCome: [[6,6]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*7*/{piece: -1, blocking: [], canGoTo: [], canCome: [[7,6]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//         ],
//         [//row:4
//             /*0*/{piece: -1, blocking: [], canGoTo: [], canCome: [[0,1]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*1*/{piece: -1, blocking: [], canGoTo: [], canCome: [[1,1]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*2*/{piece: -1, blocking: [], canGoTo: [], canCome: [[2,1]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*3*/{piece: -1, blocking: [], canGoTo: [], canCome: [[3,1]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*4*/{piece: -1, blocking: [], canGoTo: [], canCome: [[4,1]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*5*/{piece: -1, blocking: [], canGoTo: [], canCome: [[5,1]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*6*/{piece: -1, blocking: [], canGoTo: [], canCome: [[6,1]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*7*/{piece: -1, blocking: [], canGoTo: [], canCome: [[7,1]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//         ],
//         [//row:5
//            /*0*/ {piece: -1, blocking: [], canGoTo: [], canCome: [[0,1]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*1*/{piece: -1, blocking: [], canGoTo: [], canCome: [[1,1]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*2*/{piece: -1, blocking: [], canGoTo: [], canCome: [[2,1]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*3*/{piece: -1, blocking: [], canGoTo: [], canCome: [[3,1]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*4*/{piece: -1, blocking: [], canGoTo: [], canCome: [[4,1]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*5*/{piece: -1, blocking: [], canGoTo: [], canCome: [[5,1]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*6*/{piece: -1, blocking: [], canGoTo: [], canCome: [[6,1]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*7*/{piece: -1, blocking: [], canGoTo: [], canCome: [[7,1]], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//         ],
//         [//row:6
//             /*0*/{ piece: 10, blocking: [[7,0]],                   canGoTo: [[5,0],[4,0]], canCome: [], rays: [[1,2,1],[0,0,0],[0,0,0]]},
//             /*1*/{ piece: 10, blocking: [[7,2]],                   canGoTo: [[5,1],[4,1]], canCome: [], rays: [[1,2,1],[0,0,0],[0,0,0]]},
//             /*2*/{ piece: 10, blocking: [[7,3]],                   canGoTo: [[5,2],[4,2]], canCome: [], rays: [[1,2,1],[0,0,0],[0,0,0]]},
//             /*3*/{ piece: 10, blocking: [[7,1],[7,2],[7,3],[7,4]], canGoTo: [[5,3],[4,3]], canCome: [], rays: [[1,2,1],[0,0,0],[0,0,0]]},
//             /*4*/{ piece: 10, blocking: [[7,3],[7,4],[7,5],[7,6]], canGoTo: [[5,4],[4,4]], canCome: [], rays: [[1,2,1],[0,0,0],[0,0,0]]},
//             /*5*/{ piece: 10, blocking: [[7,4]],                   canGoTo: [[5,5],[4,5]], canCome: [], rays: [[1,2,1],[0,0,0],[0,0,0]]},
//             /*6*/{ piece: 10, blocking: [[7,5]],                   canGoTo: [[5,6],[4,6]], canCome: [], rays: [[1,2,1],[0,0,0],[0,0,0]]},
//             /*7*/{ piece: 10, blocking: [[7,7]],                   canGoTo: [[5,7],[4,7]], canCome: [], rays: [[1,2,1],[0,0,0],[0,0,0]]},
//         ],
//         [//row:7
//             /*0*/{ piece: 11, blocking: [],      canGoTo: [],            canCome: [], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*1*/{ piece: 12, blocking: [[7,0]], canGoTo: [[5,0],[5,2]], canCome: [], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*2*/{ piece: 13, blocking: [[7,3]], canGoTo: [],            canCome: [], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*3*/{ piece: 14, blocking: [[7,4]], canGoTo: [],            canCome: [], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*4*/{ piece: 15, blocking: [[7,3]], canGoTo: [],            canCome: [], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*5*/{ piece: 13, blocking: [[7,4]], canGoTo: [],            canCome: [], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*6*/{ piece: 12, blocking: [[7,7]], canGoTo: [[5,5],[5,7]], canCome: [], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//             /*7*/{ piece: 11, blocking: [],      canGoTo: [],            canCome: [], rays: [[0,0,0],[0,0,0],[0,0,0]]},
//         ]
//     ];
//     private whitesTurn = true
//     private isArraysEqual(a: [number, number], b: [number, number]): boolean {
//         return a[0] === b[0] && a[1] === b[1];
//     }
//     private getDirection(from:[number, number], to:[number, number]):[number, number]{
//         let rowStep=0
//         let colStep=0
//         if (to[0] > from[0]) {
//             rowStep = 1
//         } else if(to[0] < from[0]){
//             rowStep = -1
//         }
//         if (to[1] > from[1]) {
//             colStep = 1
//         } else if(to[1] < from[1]){
//             colStep = -1
//         }
//         return [rowStep, colStep]
//     }
//     private moveNext(currPosition:[number, number], direction:[number, number]): [number, number] | null {
//         if (currPosition[0]+direction[0] < 0 || currPosition[1]+direction[1] < 0 || currPosition[0]+direction[0] > 7 || currPosition[1]+direction[1] > 7) {
//             return null
//         }
//         return [currPosition[0]+direction[0], currPosition[1]+direction[1]]
//     }
//     private pieceAt(position:[number, number]): Square {
//         return this.board[position[0]][position[1]]
//     }
//     private getSpan(typeOfPiece:number):[[number, number, number], [number, number, number], [number, number, number]] {
//         switch (typeOfPiece%10) {
//             case 0:
//                 return [[1,2,1],
//                         [0,0,0],
//                         [1,2,1]] //pawn
//             case 1:
//                 return [[0,7,0],
//                         [7,0,7],
//                         [0,7,0]] //rook
//             case 2:
//                 return [[7,7,7],
//                         [7,0,7],
//                         [7,7,7]] //knight
//             case 3:
//                 return [[7,0,7],
//                         [0,0,0],
//                         [7,0,7]] //bishop
//             case 4:
//                 return [[7,7,7],
//                         [7,0,7],
//                         [7,7,7]] //queen
//             case 5:
//                 return [[1,1,1],
//                         [1,0,1],
//                         [1,1,1]] //king
//             default:
//                 return [[7,7,7],
//                         [7,0,7],
//                         [7,7,7]]
//         }
//     }
//     private distance(from:[number, number], to:[number, number]): number {
//         return Math.max(Math.abs(from[0]-to[0]),Math.abs(from[1]-to[1]))  
//     }
//     private present(position:[number,number], array:[number,number][]) {
//         return array.some(element => this.isArraysEqual(position, element))
//     }
//     private upsert(value:[number,number], position:[number,number], property: 'blocking' | 'canCome' | 'canGoTo' ) {
//         let square = this.pieceAt(position)
//         if (!this.present(position, square[property])) {
//             square[property].push(value)
//         }
//     }
//     private updateRay(blockedPiecePosition:[number, number], blockingPiecePosition:[number, number]){
//         let blockingPiece = this.pieceAt(blockingPiecePosition)
//         let blockedPiece = this.pieceAt(blockedPiecePosition)
//         let distance = this.distance(blockedPiecePosition, blockingPiecePosition)
//         let direction = this.getDirection(blockedPiecePosition, blockingPiecePosition)
//         let span = this.getSpan(blockedPiece.piece)
//         let steps = span[direction[0]][direction[1]] - distance
//         if (blockingPiece.piece !== -1) {
//             if (this.ofSameColor(blockedPiece, blockingPiece)) {
//                 blockedPiece.rays[direction[0]][direction[1]] = Math.min(distance-1, steps-distance)
//             }else{
//                 blockedPiece.rays[direction[0]][direction[1]] = Math.min(distance, steps-distance)
//             }
//             return
//         }
//         let nextPosition:[number, number] | null = blockingPiecePosition
//         while ( steps && nextPosition && this.pieceAt(nextPosition).piece === -1) {
//             distance++        
//             steps--    
//             nextPosition = this.moveNext(blockingPiecePosition, direction)
//         }
//         blockedPiece.rays[direction[0]][direction[1]] = distance
//         //we can also update the blocking property of blocked piece here
//         if (nextPosition && this.pieceAt(nextPosition).piece !== -1) {
//             blockedPiece.blocking.push(nextPosition)
//         }
//     }
//     private computeCanGoTo(position: [number,number]) {
//         //this method also updates the canCome of the squares along the way
//         let piece = this.pieceAt(position)
//         let canGoTo:[number,number][] = [];
//         for (let i = -1; i < 2; i++) {
//             for (let j = -1; j < 2; j++) {
//                 for (let k = 1; k <= piece.rays[i+1][j+1]; k++) {
//                     canGoTo.push([position[0]+i*k, position[1]+j*k])
//                     this.upsert(position, [position[0]+i*k, position[1]+j*k], 'canCome')
//                 }
//             }
//         }
//         piece.canGoTo = canGoTo
//     }
//     private computeCanGoTo(position: [number,number], direction:[number,number]) {
//         //this method also updates the canCome of the squares along the way
//         let piece = this.pieceAt(position)
//         let canGoTo:[number,number][] = [];
//         for (let i = -1; i < 2; i++) {
//             for (let j = -1; j < 2; j++) {
//                 for (let k = 1; k <= piece.rays[i+1][j+1]; k++) {
//                     canGoTo.push([position[0]+i*k, position[1]+j*k])
//                     this.upsert(position, [position[0]+i*k, position[1]+j*k], 'canCome')
//                 }
//             }
//         }
//         piece.canGoTo = canGoTo
//     }
//     private updateCanGoTo(blockedPiecePosition:[number,number], blockingPiecePosition:[number, number]){
//         this.updateRay(blockedPiecePosition, blockingPiecePosition)//this method also updates the blocking property of the blockedPieces
//         this.computeCanGoTo(blockedPiecePosition)//this method also updates the canCome of the squares along the way
//     }
//     private updateBlocking(blockedPiecePosition:[number,number], blockingPiecePosition:[number, number]){
//         let blockedPiece = this.pieceAt(blockedPiecePosition)
//         let distance = this.distance(blockedPiecePosition, blockingPiecePosition)
//         let direction = this.getDirection(blockedPiecePosition, blockingPiecePosition)
//         let reach = this.getSpan(blockedPiece.piece)[direction[0]][direction[1]]
//         if (reach >= distance) {
//             blockedPiece.blocking.push(blockingPiecePosition)
//         }
//     }
//     private updateCanCome(blockedPiecePosition:[number, number], blockingPiecePosition:[number, number]) {
//         let blockedPiece = this.pieceAt(blockedPiecePosition)
//         let blockingPiece = this.pieceAt(blockingPiecePosition)
//         let distance = this.distance(blockingPiecePosition, blockedPiecePosition)
//         let direction = this.getDirection(blockingPiecePosition, blockedPiecePosition)
//         let reach = this.getSpan(blockedPiece.piece)[direction[0]][direction[1]]
//         if (reach >= distance && this.ofSameColor(blockedPiece, blockingPiece)) {
//             blockedPiece.canCome.push(blockingPiecePosition)
//         }
//     }
//     private removePosition(remove:[number,number], property: 'blocking' | 'canCome' | 'canGoTo', from: [number, number]) {
//         let square = this.pieceAt(from)
//         square[property] = square[property].filter(element => !this.isArraysEqual(element, remove));
//     }
//     private updatePrevPosition(blockingSquare: Square, blockingPiecePosition:[number, number]) {
//         blockingSquare.canCome = blockingSquare.blocking
//         blockingSquare.canGoTo.forEach(canGoTo => {
//             this.removePosition(blockingPiecePosition, 'canCome', canGoTo)
//         })
//         blockingSquare.canGoTo = []
//         blockingSquare.blocking.forEach(blockedPiecePosition => {
//             this.updateCanGoTo(blockedPiecePosition, blockingPiecePosition)//this method also updates the blocking property of the blockedPieces
//             // this.updateBlocking(blockedPiecePosition, blockingPiecePosition)
//             this.updateCanCome(blockedPiecePosition, blockingPiecePosition)
//         });
//         blockingSquare.blocking = []
//         blockingSquare.rays = [[0,0,0],[0,0,0],[0,0,0]]
//     }
//     private ofSameColor(piece1:Square, piece2:Square):boolean {
//         return ((piece1.piece > 9)===(piece2.piece > 9))? true : false
//     }
//     private undateCanGoTo(blockedPiecePosition:[number, number], blockingPiecePosition:[number, number]) {
//         let blockingPiece = this.pieceAt(blockingPiecePosition)
//         let blockedPiece = this.pieceAt(blockedPiecePosition)
//         let distance = this.distance(blockedPiecePosition, blockingPiecePosition)
//         let direction = this.getDirection(blockedPiecePosition, blockingPiecePosition)
//         blockedPiece.rays[direction[0]][direction[1]] = this.ofSameColor(blockedPiece, blockingPiece) ? distance-1 : distance
//         this.computeCanGoTo(blockedPiecePosition)
//     }
//     private updateNewPosition(newSquare: Square ,newPosition:[number, number]) {
//         newSquare.blocking = newSquare.canCome
//         let span = this.getSpan(newSquare.piece)
//         for (let i = -1; i < 2; i++) {
//             for (let j = -1; j < 2; j++) {
//                 for (let k = 1; k <= span[i+1][j+1]; k++) {
//                     if (this.pieceAt([newPosition[0]+i, newPosition[1]+j]).piece !== -1) {
//                         let canGoToSquare = this.pieceAt([newPosition[0]+i, newPosition[1]+j])
//                         newSquare.rays[i+1][j+1] = this.ofSameColor(newSquare, canGoToSquare) ? k-1 : k
//                         this.pieceAt([newPosition[0]+i, newPosition[1]+j]).blocking.push(newPosition)
//                         break
//                     }
//                 }
//             }
//         }
//         this.computeCanGoTo(newPosition)
//         newSquare.blocking.forEach(blockedPiecePositiion => {
//             this.undateCanGoTo(blockedPiecePositiion, newPosition)
//         })
//     }
//     move(from:[number,number], to:[number,number]): void | Error{
//         let prevSquare = this.pieceAt(from)
//         if (prevSquare.piece === -1) {
//             throw Error('No piece is selected.')
//         }
//         if (this.whitesTurn !== (prevSquare.piece > 9 )) {
//             throw Error(`It is ${this.whitesTurn?'White':'Black'}'s turn.`)
//         }
//         if (prevSquare.canGoTo?.some((arr => this.isArraysEqual(arr, to)))) {
//             let newSquare = this.pieceAt(to)
//             newSquare.piece = prevSquare.piece
//             prevSquare.piece = -1
//             this.updatePrevPosition(prevSquare, from)
//             this.updateNewPosition(newSquare, to)
//             this.whitesTurn = !this.whitesTurn
//         }else{
//             console.log('not go');            
//         }
//     }
// }
// // Create a new object of Chess
// const chessGame = new Chess();
// // chessGame.move([6,0],[5,0])
// // chessGame.move([6,0],[3,0])
//# sourceMappingURL=chess2.js.map
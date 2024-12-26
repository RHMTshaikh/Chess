import { Player } from "../../types";

// Function to calculate the Probability
function probability(rating1: number, rating2: number): number {
    // Calculate and return the expected score
    return 1 / (1 + Math.pow(10, (rating1 - rating2) / 400));
}

// Function to calculate Elo rating
// K is a constant.
// outcome determines the outcome: 1 for whitePlayer win, 0 for blackPlayer win, 0.5 for draw.
export function eloRating(whitePlayer: Player, blackPlayer: Player, outcome: number): void {
    console.log('Previous  whiteRating: ',whitePlayer.rating,' blackrating: ', blackPlayer.rating);
    
    const K: number = 32;
    // Validate outcome input
    if (outcome < 0 || outcome > 1) {
        throw new Error("Outcome must be between 0 and 1 (0 for loss, 1 for win, 0.5 for draw)");
    }

    // Calculate the Winning Probability of Player A
    const probabilityWhiteWinning = probability(blackPlayer.rating, whitePlayer.rating);

    const transferOfRating = Math.round(K * (outcome - probabilityWhiteWinning));

    // Update the Elo Ratings
    whitePlayer.rating = whitePlayer.rating + transferOfRating;
    blackPlayer.rating = blackPlayer.rating - transferOfRating;
    console.log('After  whiteRating: ',whitePlayer.rating,' blackrating: ', blackPlayer.rating);
}


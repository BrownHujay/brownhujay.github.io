from flask import Flask, jsonify, request
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load the scoreboard from file
data_file = "/Users/kotnewm/Documents/Javascript/Backend/data.json"

with open(data_file, "r") as f:
    data = json.load(f)

@app.route('/scoreboard/get', methods=['GET'])
def get_players():
    """Return the leaderboard."""
    with open(data_file, "r") as f:
        data = json.load(f)
    return jsonify(data)

@app.route('/scoreboard/post', methods=['POST'])
def add_or_update_player():
    """Add a new player or update their score if it's higher."""
    
    player = request.get_json()
    
    if not player or "id" not in player or "score" not in player:
        return jsonify({"error": "Invalid data"}), 400

    # Check if the player already exists in the data
    player_exists = False
    
    for existing_player in data:
        
        if existing_player["id"] == player["id"]:
            
            player_exists = True
            # Update the score only if it's higher
            if player["score"] > existing_player["score"]:
                
                existing_player["score"] = player["score"]
            
            break

    if not player_exists:
        # Add a new player record
        
        data.append({
            "id": player["id"],
            "name": player.get("name", "Unknown Player"),
            "score": player["score"]
        })

    # Save the updated data back to the file
    with open(data_file, "w") as f:
        json.dump(data, f, indent=4)

    return jsonify({"message": "Player score processed successfully", "data": data}), 200

if __name__ == '__main__':
    app.run(port=5000)

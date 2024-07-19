const express = require('express');
const http = require('http');
const cors = require('cors');
const db = require('./config/db.config');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);

const PORT = 3300;
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));

// Generating JWT
app.get("/api/players", (req, res) => {
  db.query(`SELECT * FROM players ORDER BY score DESC LIMIT 4;`, (err, result) => {
    const players = result;
    if (players) {
      res.json(players);
    }
  });
});

app.post('/api/player/add', (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).send('Player name is required.');
  }

  // First, check if a player with the same name already exists
  const checkSql = 'SELECT COUNT(*) AS count FROM players WHERE name = ?';
  db.query(checkSql, [name], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error checking player existence.');
    }
    if (results[0].count > 0) {
      // Player with the same name already exists
      return res.status(400).send('This name already exists.');
    }

    // Proceed to insert the new player
    const insertSql = 'INSERT INTO players (name, score) VALUES (?, ?)';
    const values = [name, 0];

    db.query(insertSql, values, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error adding player.');
      }
      res.send('Player added successfully.');
    });
  });
});


app.put('/api/player/update', (req, res) => {
  const { name, score } = req.body;

  // Ensure 'name' and 'score' are provided
  if (typeof name !== 'string' || typeof score !== 'number') {
    return res.status(400).send('Invalid input: name and score are required.');
  }

  // Use parameterized query to prevent SQL injection
  const sql = 'UPDATE players SET score = ? WHERE name = ?';
  const values = [score, name];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error updating score.');
    }

    if (result.affectedRows === 0) {
      return res.status(404).send('Player not found.');
    }

    res.send('Player score updated successfully.');
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
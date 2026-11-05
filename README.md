# Baccarat Online (2–4 players)

Multiplayer Baccarat-style prediction game with **virtual rewards only**. Each correct prediction earns 500 virtual VND; no deposits, withdrawals or real-money gambling.

## Run locally

```bash
npm install
npm start
```

Visit http://localhost:3000.

## Deploy to Render

1. Push this whole repository to GitHub (including `server.js`, `package.json`, and `public/index.html`).
2. Render → New → Web Service → connect your GitHub repository.
3. Runtime: Node. Build Command: `npm install`. Start Command: `npm start`.
4. Deploy and share the Render URL. Rooms can be joined using a six-character code or invitation link.

## Notes

- A room starts only when exactly 2, 3, or 4 players (as selected by its creator) have joined and all are ready.
- Every round: each player predicts Banker, Player, or Tie. A standard Baccarat third-card drawing rule determines the shared result.
- The server resolves the round once all predictions are submitted or after 30 seconds.
- The host advances to the next round; everyone must ready up again.
- Rooms and balances are held **in memory**: server restart or sleeping instance clears them. Disconnects remove players from rooms. One Render instance is required; multi-instance scaling needs a shared state adapter/database.
- For a public production game, add persistent player accounts, reconnect support, rate limiting, monitoring, and anti-abuse protections.

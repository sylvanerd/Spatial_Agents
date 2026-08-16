# Conductor laptop bridge (optional)

Preview boots from the bundled fixture and does **not** need this process.

```bash
cd bridge
npm install
npm start
```

- Verify page: http://127.0.0.1:8080/
- WebSocket: `ws://127.0.0.1:8080`

In the Lens HUD, toggle **Offline mock → Live**. Experimental APIs must be on for `ws://` in Preview (Project Settings). Device Type Override stays **SPECS 27**.

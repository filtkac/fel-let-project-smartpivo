# Lékařská technika project

By Filip Tkáč, František Krupička

- Activate virtual environment by `source venv/bin/activate`.
- Run python server in be/src: `uvicorn server:app --host 0.0.0.0` (add --reload for hot-reloading).
- Run nextjs server in fe `npm run start`. (if not built, then run `npm run build` first)
- Cloudflare tunnel redirecting traffic to raspberry. (set up with cloudflare zero trust GUI, redirecing to http://localhost:3000 - NextJS server)

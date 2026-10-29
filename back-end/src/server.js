import "dotenv/config";
import app from "./app.js";

const PORT = process.env.API_PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

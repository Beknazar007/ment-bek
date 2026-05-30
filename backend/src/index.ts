import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { prisma } from "../prisma/client";
import { bootstrapDevUsers } from "./devBootstrap";
import { requireAuth } from "./middleware/auth";
import { ErrorHandler } from "./middleware/errorHandler";
import adminRouter from "./routes/admin";
import authRouter from "./routes/auth";
import availabilityRouter from "./routes/availability";
import bookingRouter from "./routes/bookings";
import profileRouter from "./routes/profiles";
import timeSlotsRouter from "./routes/timeSlots";

const app = express();

const corsOrigins = [
	process.env.FRONTEND_URL,
	...(process.env.NODE_ENV !== "production"
		? ["http://localhost:3001", "http://localhost:3000", "http://localhost:3002"]
		: []),
].filter((origin): origin is string => Boolean(origin));

app.use(
	cors({
		origin: corsOrigins.length > 0 ? corsOrigins : true,
		credentials: true,
		methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
);

app.use(express.json());
app.use("/auth", authRouter);
app.use("/profiles", profileRouter);
app.use("/admin", adminRouter);
app.use("/bookings", bookingRouter);
app.use("/availability", availabilityRouter);
app.use("/time-slots", timeSlotsRouter);

app.get("/health", (_: Request, res: Response) => {
	res.json({ status: "ok" });
});

app.post("/hello", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
	try {
		const text: string = req.body?.text ?? "Hello, World!!";
		const msg = await prisma.message.create({ data: { text } });
		res.status(201).json(msg);
	} catch (err) {
		next(err);
	}
});

app.get("/hello", async (_: Request, res: Response, next: NextFunction) => {
	try {
		const latest = await prisma.message.findFirst({
			orderBy: { createdAt: "desc" },
		});
		res.json({ latest });
	} catch (err) {
		next(err);
	}
});

app.use(ErrorHandler);

const PORT = process.env.PORT ?? 3000;
const HOST = "0.0.0.0";
app.listen(Number(PORT), HOST, async () => {
	console.log(`Server running on http://${HOST}:${PORT}`);
	try {
		await bootstrapDevUsers();
	} catch (err) {
		console.error("[devBootstrap] Failed to bootstrap dev users:", err);
	}
});

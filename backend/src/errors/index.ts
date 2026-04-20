export class AppError extends Error {
	constructor(
		message: string,
		public readonly code: number,
	) {
		super(message);
	}
}

export class NotFoundError extends AppError {
	constructor(message = "Not found") {
		super(message, 404);
	}
}

export class ConflictError extends AppError {
	constructor(message = "Conflict") {
		super(message, 409);
	}
}

export class ValidationError extends AppError {
	constructor(message = "Bad request") {
		super(message, 400);
	}
}
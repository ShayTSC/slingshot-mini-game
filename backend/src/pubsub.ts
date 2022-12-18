import { Subject } from "rxjs";
import { IAsteroid } from "./models/asteroids";
import { IMiner } from "./models/miners";
import { IPlanet } from "./models/planets";

enum Actions {
	ADD="add",
	UPDATE="update",
	DELETE="delete",
}

interface MessageBody {
	action: Actions;
	asteroid?: IAsteroid | any; // TODO: Extend interface in the future
	miner?: IMiner | any;
	planet?: IPlanet | any;
}

const subject = new Subject<MessageBody>();

export {
	MessageBody,
	Actions,
	subject,
}

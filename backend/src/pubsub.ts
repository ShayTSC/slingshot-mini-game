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
	asteroid?: IAsteroid;
	miner?: IMiner;
	planet?: IPlanet;
}

const subject = new Subject<MessageBody>();

export {
	subject,
	MessageBody,
}

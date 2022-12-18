# BUILD LOG

This file logs my idea on implementing the test.

## APOLOGIZE

I apologize my terrible time management on this project, apparently I'll keep updating this project because it's fun to do. I was in hosipital in Saturday and have tons of works to do during the entire weekend and my current empoyer ask me to work `996` at minimum. It's not an excuse for delay but I just want to say sorry for the delaying endlessly on this test.

## Tech Stack

I used the recommended tech stack, using `Node.js`, `Express.js`, `MongoDB` to building this application. I'm more get used to TypeScript, so I'll build with `TypeScript` too.

In some cases the data body inside RESTful services have standards, for example to have wrappers to transfer data bitween services. But in this implementation I will just transfer the required information I want, with no standard applied.

## Database

The definition of collections are basically identical to the example json output provided, except the minerals field I added in the planet collection.

I setup the unique index to various columns in the collection, like `id`s in the miners and planets collections, and `name` in the asteroids collection.

## File Structure (Backend)

Because this application is relatively simple, so there won't be a complicated structure.

Except the source files listed below, there's a `sample` and `scripts` folder for storing data examples and scripts to reset database.

```Text
./backend/src
├── apis.ts
├── events.ts
├── main.ts
├── models
│   ├── asteroids.ts
│   ├── miners.ts
│   └── planets.ts
├── pubsub.ts
├── utils.ts
└── websocket.ts
```

## Thoughts on implementation

The game mechanism is relatively easy but there are many detail to be focused on. In my version of implementation. Here's some thoughts I'm thinking while I'm building this.

### Data persistance

The status of the operation will be not saved first while a miner entering a new stage, so that when the server reboots accidentally, it will continues the current task. This could be problem for `mining` stage, because there should be a LOCK mechanism in third-party cache server like Redis, so that the states will survive the server down time. But in here I just didn't implement it. I'll just assume that the server will works fine. (Limit of time, sorry)

### Miners working logic

The method that driven the miners are easy. Miners will find the nearest planet that the resource is above 0, and mine as much as it can, then head back to the mother planet. There are optimizations to be done for sure, for example the picking of the asteroids should be also considering the travel time and capacity to maximize the mining volume per hour. There should be a formula for the best solution.

### The state machine

I choose a third-party state machine to drive the miner, the library is called `xstate`. I spent quite some time to learn the library. And it works pretty well. There's a bit mess in the code, I have to have a object to store the relationship between asteroid and miner location in the memory. This is also should be maintained alongs a bunch of other states in a dedicated cache server.

### Websocket server

Originally I put a lot of thoughts into the design of a subscription based websocket server, but I realized I might overthink too much.

This websocket server here is a broadcast server, the purpose of it is to update data of the three tables in real time. So there's not much needs to manage the relations of the connected clients.

So instead of using the standard jsonprc request I'll make a custom body to just specify to table to update, the the data and the operation with the payload. The message body looks some thing like this, alongs with the message body, also there's a enum for types of message.

```TypeScript
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
```

## Progress

- The events module is basically finished, needs more testing and debug.

- The restful module has mostly finished, more aggregation has been added for the convenience on front-end queries.

- Now the HTTP APIs and WebSocket works okay without interruptions. There should be more work to be done like websocket keep-alive and more error handling and interruption recovery. But a fresh start will keep works fine.

- Rewrite some of the front-end project class component into function component.

## Problems

- Now if the server restarts, there's no proper recovery mechanism on both frontend and backend, websocket and state machines are not going to be recovered perfectly.

- The state machine will hangs some while after running for sometimes. Not certain if it is the minerals has been drained on all asteroids, the reason is still yet to be found.

- Some behaviors, like delete or add miners/asteroids/planets will not have effects on websockets and state machine, and thus no add/remove websocket event. So far I only implemented the "UPDATE" events. But the design is reserved for the implementation, the state machines are stored in a map, it is easy to locate and execute/suspend.

- Removed spinners from some of the front-end components because I think it is better to put the spinners in the inner components. That's where the data loads. But I haven't implement the spinners yet.

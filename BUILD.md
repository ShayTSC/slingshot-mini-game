# BUILD LOG

This file logs my idea on implementing the test.

## Tech Stack

I used the recommended tech stack, using `Node.js`, `Express.js`, `MongoDB` building this application. I'm more get used to TypeScript, so I'll build with `TypeScript` too.

For some cases data body inside RESTful services have standards. But here I will just transfer the required information I want, no standard applied.

## Database

The collections of database is basically identical to the example json output provided, except the minerals field I added in the planet collection.

I setup the unique index to various key in the collection, like `id`s in the miners and planets collections, and `name` in the asteroids collection.

## File Structure

Because this application is relatively simple, so there won't be a complicated structure.

```

```

## Thinkings on implementation

By default the miner will spawn on the planet. The event loop will use the last record in history collection as the location and start stage of a miner. I there's no record in history collection, then the miner will be seen as start on the planet it belongs to and fly to the closest asteroid and start mining.

### Websocket server

I originally put a lot of thoughts into the design of a subscription based websocket server, but I might just over think it.

This websocket server here is a broadcast server, the purpose of it is to update data of the three tables in real time.

So instead of using the standard jsonprc request I'll make a custom body to just specify to table to update, the index of the data and the operation with the payload. CRUD indeed.

To achieve that I need a reflect mechanism to emit trigger from REST apis and running state machine. Rxjs seems like the right way to do the work.

### Miner logic

A miner will find a nearest asteroid which has non-zero minerals (status=1) in `travleing` state.

Once the miner has landed on the asteroids, the amount of remain capacity of the miner will be subtract first from the astroid, and the miner will enter the `mining` status.

If the miner reach full capacity, then miner will head home planet in `transfering` state. Or the miner will seek for another nearest asteroid to fill up the capacity, then head home.

The logic upon will build into a state machine.

If a miner got deleted, the resource on it will be vanished too.

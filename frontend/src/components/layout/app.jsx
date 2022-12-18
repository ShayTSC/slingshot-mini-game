/**
 * Main app layout
 */
import Header from './header.jsx'
import Nav from './nav.jsx'
import Miners from '../miner/list.jsx'
import Asteroids from '../asteroid/list.jsx'
import Planets from '../planet/list.jsx'
import {
  BrowserRouter as Router,
  Switch,
  Route
} from 'react-router-dom'
import { webSocket } from 'rxjs/webSocket'

function App() {
	return (
		<Router>
			<main>
				<Header />
				<Nav />

				<Switch>
					<Route path="/miners">
						<Miners />
					</Route>
					<Route path="/asteroids">
						<Asteroids />
					</Route>
					<Route path="/planets">
						<Planets />
					</Route>
				</Switch>
			</main>
			<aside />
		</Router>
	);
}

export const subject = webSocket('ws://127.0.0.1:8081')

export default App
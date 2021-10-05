const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');

const when = require('when');

const follow = require('./follow');

const root = '/api';

class App extends React.Component { 

	constructor(props) {
		super(props);
		this.state = {employees: [], attributes: [], pageSize: 2, links: {}};
		this.updatePageSize = this.updatePageSize.bind(this);
		this.onCreate = this.onCreate.bind(this);
		this.onUpdate = this.onUpdate.bind(this);
		this.onDelete = this.onDelete.bind(this);
		this.onNavigate = this.onNavigate.bind(this);
	}

	componentDidMount() { 
		this.loadFromServer(this.state.pageSize);
	}
	
	loadFromServer(pageSize) {
		follow(client, root, [
			{rel: 'employees', params: {size: pageSize}}
		]).then(employeeCollection => client({
            method: 'GET',
            path: employeeCollection.entity._links.profile.href,
            headers: { 'Accept': 'application/schema+json' }
        }).then(schema => {
            this.schema = schema.entity;
            this.links = employeeCollection.entity._links;
            return employeeCollection;
        })).then(employeeCollection => employeeCollection.entity._embedded.employees.map(employee =>
        	client({
				method: 'GET',
				path: employee._links.self.href
			})
		)).then(employeePromises => 
			 when.all(employeePromises)
		).done(employees => {
			this.setState({
				employees: employees,
				attributes: Object.keys(this.schema.properties),
				pageSize: pageSize,
				links: this.links
			});
		});
	}
	
	onCreate(newEmployee) {
		const self = this;
		follow(client, root, ['employees']).then(res => client({
			method: 'POST',
			path: res.entity._links.self.href,
			entity: newEmployee,
			headers: {'Content-Type': 'application/json'}
		})).then( () => 
				follow(client, root, [
					{rel: 'employees', params: {'size': self.state.pageSize}}
				])
		).done(res => {
			if (typeof res.entity._links.last !== "undefined") {
				this.onNavigate(res.entity._links.last.href);
			} else {
				this.onNavigate(res.entity._links.self.href);
			}
		});
	}
	
	onUpdate(employee, updatedEmployee) {
		client({
			method:'PUT',
			path: employee.entity._links.self.href,
			entity: updatedEmployee,
			headers: {
				'Content-Type': 'application/json',
				'If-Match': employee.headers.Etag
			}
		}).done( res => {
			this.loadFromServer(this.state.pageSize);
		}, res => {
			if (res.status.code === 412) {
				alert('DENIED: Unable to update '+ employee.entity._links.self.href + '. Your copy is stale.')
			}
		});
	}
	
	onDelete(employee) {
		client({method: 'DELETE', path: employee.entity._links.self.href}).done( () => {
			this.loadFromServer(this.state.pageSize);
		});
	}
	
	onNavigate(navUri) {
		client({
			method: 'GET', 
			path: navUri
			}).then(employeeCollection => {
				this.links = employeeCollection.entity._links;
				return employeeCollection.entity._embedded.employees.map(employee =>
					client({
						method: 'GET',
						path: employee._links.self.href
					})
				)
			}).then(employeePromises => 
				when.all(employeePromises)
			).done(employees => {
				this.setState({
					employees: employees,
					attributes: Object.keys(this.schema.properties),
					pageSize: this.state.pageSize,
					links: this.links
				});
			});
	}
	
	updatePageSize(pageSize) {
		if (pageSize !== this.state.pageSize) {
			this.loadFromServer(pageSize);
		}
	}

	render() { 
		return (
			<div>
			
				<CreateDialog 
					attributes={this.state.attributes} 
					onCreate={this.onCreate}
				/>
				
				<EmployeeList 
					employees={this.state.employees}
					links={this.state.links} 
					pageSize={this.state.pageSize} 
					attributes={this.state.attributes}
					onNavigate={this.onNavigate} 
					onUpdate={this.onUpdate}
					onDelete={this.onDelete} 
					updatePageSize={this.updatePageSize}
				/>
				
			</div>		
		)
	}
}

class EmployeeList extends React.Component{
	
	constructor(props) {
		super(props);
		this.handleNavFirst = this.handleNavFirst.bind(this);
		this.handleNavPrev = this.handleNavPrev.bind(this);
		this.handleNavNext = this.handleNavNext.bind(this);
		this.handleNavLast = this.handleNavLast.bind(this);
		this.handleInput = this.handleInput.bind(this);
	}
	
	handleInput(e) {
		e.preventDefault();
		const pageSize = ReactDOM.findDOMNode(this.refs.pageSize).value;
		if (/^[0-9]+$/.test(pageSize)) {
			this.props.updatePageSize(pageSize);
		} else {
			ReactDOM.findDOMNode(this.refs.pageSize).value = pageSize.substring(0, pageSize.length - 1);
		}
	}
	
	handleNavFirst(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.first.href);
	}
	
	handleNavPrev(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.prev.href);
	}

	handleNavNext(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.next.href);
	}
	
	handleNavLast(e) {
		e.preventDefault();
		this.props.onNavigate(this.props.links.last.href);
	}
	
	
	
	render() {
		const employees = this.props.employees.map(employee =>
			<Employee 
				key={employee.entity._links.self.href}
			 	employee={employee} 
			 	attributes={this.props.attributes}
			 	onUpdate={this.props.onUpdate}
			 	onDelete={this.props.onDelete}
			 	/>
		);
		
		const navLinks = [];
		
		if ("first" in this.props.links) {
			navLinks.push(<button key="first" onClick={this.handleNavFirst}>&lt;&lt;</button>);
		}
		
		if ("prev" in this.props.links) {
			navLinks.push(<button key="prev" onClick={this.handleNavPrev}>&lt;</button>)
		}
		
		if ("next" in this.props.links) {
			navLinks.push(<button key="next" onClick={this.handleNavNext}>&gt;</button>)
		}
		
		if ("last" in this.props.links) {
			navLinks.push(<button key="last" onClick={this.handleNavLast}>&gt;&gt;</button>)
		}
		
		return (
			<div>
				
				<label htmlFor="pageSize">Results on page </label>
				<input name="pageSize" ref="pageSize" defaultValue={this.props.pageSize} onInput={this.handleInput}/>
				
				<table>
					<tbody>
						<tr>
							<th>First Name</th>
							<th>Last Name</th>
							<th>Description</th>
						</tr>
						{employees}
					</tbody>
				</table>
				
				<div>
					{navLinks}
				</div>
				
			</div>
		)
	}
}

class Employee extends React.Component{
	
	constructor(props) {
		super(props);
		this.handleDelete = this.handleDelete.bind(this);
	}
	
	handleDelete() {
		this.props.onDelete(this.props.employee);
	}
	
	render() {
		return (
			<tr>
				<td>{this.props.employee.entity.firstName}</td>
				<td>{this.props.employee.entity.lastName}</td>
				<td>{this.props.employee.entity.description}</td>
				<td>
					<UpdateDialog 
						employee={this.props.employee}
						attributes={this.props.attributes}
						onUpdate={this.props.onUpdate}
					/>
				</td>
				<td><button onClick={this.handleDelete}>Delete</button></td>
			</tr>
		)
	}
}

class CreateDialog extends React.Component {
	
	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}
	
	handleSubmit(e) {
		e.preventDefault();
		const newEmployee = {};
		this.props.attributes.forEach(attribute => {
			newEmployee[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
		});
		this.props.onCreate(newEmployee);
		
		this.props.attributes.forEach(attribute => {
			ReactDOM.findDOMNode(this.refs[attribute]).value = '';
		});
		
		window.location = "#";
	}
	
	render() {
		const inputs = this.props.attributes.map(attribute =>
			<p key={attribute}>
				<input type="text" placeholder={attribute} ref={attribute} className="field"/>
			</p>
		);
		
		return (
			<div>
				<a href="#createEmployee">Create</a>
				<div id="createEmployee" className="modalDialog">
					<div>
						<a href="#" title="Close" className="close">X</a>
							<h2>Create new employee</h2>
							<form>
								{inputs}
								<button onClick={this.handleSubmit}>Create</button>
							</form>
					</div>
				</div>
			</div>
		)
	}
} 

class UpdateDialog extends React.Component {
	
	constructor(props) {
		super(props);
		this.handleSubmit = this.handleSubmit.bind(this);
	}
	
	handleSubmit(e) {
		e.preventDefault();
		const updatedEmployee = {};
		this.props.attributes.forEach(attribute => {
			updatedEmployee[attribute] = ReactDOM.findDOMNode(this.refs[attribute]).value.trim();
		});
		this.props.onUpdate(this.props.employee, updatedEmployee);
		window.location = "#";
	}
	
	render() {
		
		const inputs = this.props.attributes.map(attribute => 
			<p key={this.props.employee.entity[attribute]}>
				<input 
					type="text" 
					placeholder={attribute} 
					defaultValue={this.props.employee.entity[attribute]} 
					ref={attribute} 
					className="field"
				/>
			</p>)
			
		const dialogId = "updateEmployee-" + this.props.employee.entity._links.self.href;
		
		return (
			<div key={this.props.employee.entity._links.self.href}>
				<a href={"#" + dialogId}>Update</a>
				<div id={dialogId} className="modalDialog">
					<div>
						<a href="#" title="Close" className="close">X</a>
						<h2>Update an employee</h2>
						<form>
							{inputs}
							<button onClick={this.handleSubmit}>Update</button>
						</form>
					</div>
				</div>
			</div>
		)
	}
}

ReactDOM.render(
	<App />,
	document.getElementById('react')
)
package fr.training.springDataREST;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class DatabaseLoader implements CommandLineRunner {
	
	private final EmployeeRepository employees;
	private final ManagerRepository managers;
	
	@Autowired
	public DatabaseLoader(EmployeeRepository employeeRepository, ManagerRepository managerRepository) {
		this.employees = employeeRepository;
		this.managers = managerRepository;
	}

	@Override
	public void run(String... args) throws Exception {
	
		Manager axel = this.managers.save(new Manager("axel", "1234", "ROLE_MANAGER"));
		Manager debool = this.managers.save(new Manager("debool", "1234", "ROLE_MANAGER"));
		
		SecurityContextHolder.getContext()
			.setAuthentication(new UsernamePasswordAuthenticationToken("axel", "blablabla", AuthorityUtils.createAuthorityList("ROLE_MANAGER")));
		
		this.employees.save(new Employee("Frodo", "Baggins", "Ring Bearer", axel));
		this.employees.save(new Employee("Bilbo", "Baggins", "Burglar", axel));
		this.employees.save(new Employee("Gandalf", "the Grey", "Wizard", axel));
		
		SecurityContextHolder.getContext()
			.setAuthentication(new UsernamePasswordAuthenticationToken("debool", "blablabla", AuthorityUtils.createAuthorityList("ROLE_MANAGER")));
		
		this.employees.save(new Employee("Samwise", "Gamgee", "Gardener", debool));
		this.employees.save(new Employee("Merry", "Brandybuck", "Pony Rider", debool));
		this.employees.save(new Employee("Peregrin", "Took", "Pipe Smoker", debool));
		
		SecurityContextHolder.clearContext();
	
	}
}

package fr.training.springDataREST;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DatabaseLoader implements CommandLineRunner {
	
	private final EmployeeRepository repository;
	
	@Autowired
	public DatabaseLoader(EmployeeRepository repository) {
		this.repository = repository;
	}

	@Override
	public void run(String... args) throws Exception {
		if (this.repository.count() >= 1) {
			return;
		}
		this.repository.save(new Employee("Frodo", "Baggins", "ring bearer"));
	}
}

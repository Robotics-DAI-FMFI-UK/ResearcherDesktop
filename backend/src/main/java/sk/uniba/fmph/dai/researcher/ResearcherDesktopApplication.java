package sk.uniba.fmph.dai.researcher;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class ResearcherDesktopApplication {

	public static void main(String[] args) {
		SpringApplication.run(ResearcherDesktopApplication.class, args);
	}

}

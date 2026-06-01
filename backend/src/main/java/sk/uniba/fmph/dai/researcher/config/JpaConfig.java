package sk.uniba.fmph.dai.researcher.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.web.client.RestClient;

@Configuration
@EnableJpaAuditing
public class JpaConfig {

    @Bean
    public RestClient restClient() {
        return RestClient.create();
    }
}
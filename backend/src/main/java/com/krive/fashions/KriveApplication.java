package com.krive.fashions;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class KriveApplication {

    public static void main(String[] args) {
        SpringApplication.run(KriveApplication.class, args);
    }
}

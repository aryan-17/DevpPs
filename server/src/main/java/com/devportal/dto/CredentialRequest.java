package com.devportal.dto;

import com.devportal.model.CredentialType;
import jakarta.validation.constraints.NotBlank;

public class CredentialRequest {

    @NotBlank
    private String key;

    @NotBlank
    private String value;

    private CredentialType type;

    private String description;

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public CredentialType getType() {
        return type;
    }

    public void setType(CredentialType type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}


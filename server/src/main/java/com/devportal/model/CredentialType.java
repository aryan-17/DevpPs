package com.devportal.model;

public enum CredentialType {
    SECRET,
    FILE;

    public static CredentialType fromString(String typeStr) {
        if (typeStr == null || typeStr.isBlank()) {
            return SECRET;
        }
        return "FILE".equalsIgnoreCase(typeStr) ? FILE : SECRET;
    }
}

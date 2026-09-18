package com.smartcity.exception;

public class RoadBlockedException extends RuntimeException {
    public RoadBlockedException(String roadId) {
        super("Road '" + roadId + "' is currently blocked by an accident or closure.");
    }

    public RoadBlockedException(String roadId, String message) {
        super("Road '" + roadId + "': " + message);
    }
}

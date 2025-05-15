/**
 * Base error class for PureStorage
 */
export class StorageError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'StorageError';
    this.code = code;
  }
}

/**
 * Error thrown when there's an issue with encryption/decryption
 */
export class EncryptionError extends StorageError {
  constructor(message) {
    super(message, 'ENCRYPTION_ERROR');
    this.name = 'EncryptionError';
  }
}

/**
 * Error thrown when there's an issue with serialization/deserialization
 */
export class SerializationError extends StorageError {
  constructor(message) {
    super(message, 'SERIALIZATION_ERROR');
    this.name = 'SerializationError';
  }
}

/**
 * Error thrown when a key is invalid or not found
 */
export class KeyError extends StorageError {
  constructor(message) {
    super(message, 'KEY_ERROR');
    this.name = 'KeyError';
  }
}

/**
 * Error thrown when a synchronous operation is not available
 */
export class SyncOperationError extends StorageError {
  constructor(message = 'Synchronous operation not available on this platform') {
    super(message, 'SYNC_NOT_AVAILABLE');
    this.name = 'SyncOperationError';
  }
} 
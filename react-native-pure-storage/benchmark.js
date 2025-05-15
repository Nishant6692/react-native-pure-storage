import PureStorage from './index';

/**
 * Benchmark utility for react-native-pure-storage
 */
class Benchmark {
  /**
   * Run a performance benchmark
   * @param {string} name - Name of the benchmark
   * @param {Function} fn - Function to benchmark
   * @param {number} iterations - Number of iterations to run
   * @returns {Promise<{name: string, totalTimeMs: number, opsPerSecond: number}>}
   */
  static async run(name, fn, iterations = 1000) {
    console.log(`Starting benchmark: ${name}`);
    
    const start = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      await fn(i);
    }
    
    const end = Date.now();
    const totalTimeMs = end - start;
    const opsPerSecond = Math.floor((iterations / totalTimeMs) * 1000);
    
    console.log(`Benchmark ${name}: ${totalTimeMs}ms for ${iterations} operations (${opsPerSecond} ops/sec)`);
    
    return {
      name,
      totalTimeMs,
      opsPerSecond
    };
  }
  
  /**
   * Run all benchmarks
   * @param {number} iterations - Number of iterations for each test
   * @returns {Promise<Object>} - Results of all benchmarks
   */
  static async runAll(iterations = 1000) {
    // Clean up storage for fair testing
    await PureStorage.clear();
    
    const results = {};
    
    // String write test
    results.stringWrite = await this.run('String Write', async (i) => {
      await PureStorage.setItem(`benchmark_string_${i}`, `Test value ${i}`);
    }, iterations);
    
    // String read test
    results.stringRead = await this.run('String Read', async (i) => {
      await PureStorage.getItem(`benchmark_string_${i}`);
    }, iterations);
    
    // Number write test
    results.numberWrite = await this.run('Number Write', async (i) => {
      await PureStorage.setItem(`benchmark_number_${i}`, i);
    }, iterations);
    
    // Number read test
    results.numberRead = await this.run('Number Read', async (i) => {
      await PureStorage.getItem(`benchmark_number_${i}`);
    }, iterations);
    
    // Object write test
    results.objectWrite = await this.run('Object Write', async (i) => {
      await PureStorage.setItem(`benchmark_object_${i}`, { id: i, value: `Test ${i}`, nested: { foo: 'bar' } });
    }, iterations);
    
    // Object read test
    results.objectRead = await this.run('Object Read', async (i) => {
      await PureStorage.getItem(`benchmark_object_${i}`);
    }, iterations);
    
    // Batch write test (100 items per batch, 10 batches)
    const batchIterations = Math.min(10, Math.floor(iterations / 100));
    results.batchWrite = await this.run('Batch Write (100 items)', async (i) => {
      const batch = {};
      for (let j = 0; j < 100; j++) {
        batch[`batch_${i}_${j}`] = `Batch value ${i}_${j}`;
      }
      await PureStorage.multiSet(batch);
    }, batchIterations);
    
    // Batch read test
    results.batchRead = await this.run('Batch Read (100 items)', async (i) => {
      const keys = [];
      for (let j = 0; j < 100; j++) {
        keys.push(`batch_${i}_${j}`);
      }
      await PureStorage.multiGet(keys);
    }, batchIterations);
    
    // Encrypted write test
    results.encryptedWrite = await this.run('Encrypted Write', async (i) => {
      await PureStorage.setItem(`benchmark_encrypted_${i}`, `Secret value ${i}`, { encrypted: true });
    }, Math.floor(iterations / 10)); // Encrypt fewer items as it's slower
    
    // Encrypted read test
    results.encryptedRead = await this.run('Encrypted Read', async (i) => {
      await PureStorage.getItem(`benchmark_encrypted_${i}`);
    }, Math.floor(iterations / 10));
    
    // Sync write test (if available)
    try {
      results.syncWrite = await this.run('Sync Write', (i) => {
        try {
          PureStorage.setItemSync(`benchmark_sync_${i}`, `Sync value ${i}`);
          return Promise.resolve();
        } catch (e) {
          return Promise.reject(e);
        }
      }, iterations);
    } catch (e) {
      console.log('Sync write not available:', e.message);
    }
    
    // Sync read test (if available)
    try {
      results.syncRead = await this.run('Sync Read', (i) => {
        try {
          PureStorage.getItemSync(`benchmark_sync_${i}`);
          return Promise.resolve();
        } catch (e) {
          return Promise.reject(e);
        }
      }, iterations);
    } catch (e) {
      console.log('Sync read not available:', e.message);
    }
    
    // Clean up
    await PureStorage.clear();
    
    return results;
  }
  
  /**
   * Compare with another storage library (if available)
   * @param {Object} otherStorage - Other storage library with compatible API
   * @param {number} iterations - Number of iterations
   */
  static async compareWith(otherStorage, iterations = 1000) {
    if (!otherStorage) {
      console.error('No comparison storage provided');
      return;
    }
    
    // Clear both storages
    await PureStorage.clear();
    if (otherStorage.clear) {
      await otherStorage.clear();
    }
    
    console.log('=== Comparing PureStorage vs Other Storage ===');
    
    // String write comparison
    const pureStringWrite = await this.run('PureStorage String Write', async (i) => {
      await PureStorage.setItem(`compare_string_${i}`, `Test value ${i}`);
    }, iterations);
    
    const otherStringWrite = await this.run('Other Storage String Write', async (i) => {
      await otherStorage.setItem(`compare_string_${i}`, `Test value ${i}`);
    }, iterations);
    
    // String read comparison
    const pureStringRead = await this.run('PureStorage String Read', async (i) => {
      await PureStorage.getItem(`compare_string_${i}`);
    }, iterations);
    
    const otherStringRead = await this.run('Other Storage String Read', async (i) => {
      await otherStorage.getItem(`compare_string_${i}`);
    }, iterations);
    
    console.log('=== Performance Comparison ===');
    console.log(`String Write: PureStorage ${pureStringWrite.opsPerSecond} ops/sec vs Other ${otherStringWrite.opsPerSecond} ops/sec (${Math.round((pureStringWrite.opsPerSecond / otherStringWrite.opsPerSecond) * 100)}%)`);
    console.log(`String Read: PureStorage ${pureStringRead.opsPerSecond} ops/sec vs Other ${otherStringRead.opsPerSecond} ops/sec (${Math.round((pureStringRead.opsPerSecond / otherStringRead.opsPerSecond) * 100)}%)`);
    
    // Clean up
    await PureStorage.clear();
    if (otherStorage.clear) {
      await otherStorage.clear();
    }
  }
}

export default Benchmark; 
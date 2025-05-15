import PureStorage from './index';

/**
 * benchmark.js
 * 
 * A simple utility for performance benchmarking
 */

class Benchmark {
  constructor(storage) {
    this.storage = storage;
    this.results = {};
  }

  /**
   * Run a single benchmark test
   * @param {string} name - Name of the benchmark
   * @param {Function} fn - Async function to benchmark
   * @param {number} iterations - Number of iterations (default: 100)
   * @returns {Promise<{name: string, totalTimeMs: number, opsPerSecond: number}>} Benchmark results
   */
  async run(name, fn, iterations = 100) {
    console.log(`Running benchmark: ${name} (${iterations} iterations)`);
    
    const start = Date.now();
    
    for (let i = 0; i < iterations; i++) {
      await fn(i);
    }
    
    const totalTimeMs = Date.now() - start;
    const opsPerSecond = Math.floor((iterations / totalTimeMs) * 1000);
    
    const result = {
      name,
      totalTimeMs,
      opsPerSecond
    };
    
    this.results[name] = result;
    console.log(`Benchmark ${name}: ${opsPerSecond} ops/sec (${totalTimeMs}ms total)`);
    
    return result;
  }

  /**
   * Run all standard benchmarks
   * @param {number} iterations - Number of iterations for each test (default: 100)
   * @returns {Promise<Object>} Results of all benchmarks
   */
  async runAll(iterations = 100) {
    // Reset results
    this.results = {};
    
    // Generate a unique key for each test to avoid interference
    const getKey = (i) => `benchmark_key_${Date.now()}_${i}`;
    const value = { test: "data", number: 123 };
    
    // Standard benchmarks
    await this.run('setItem', async (i) => {
      await this.storage.setItem(getKey(i), value);
    }, iterations);
    
    // Setup for getItem test
    const getKey1 = 'get_benchmark_key';
    await this.storage.setItem(getKey1, value);
    
    await this.run('getItem', async () => {
      await this.storage.getItem(getKey1);
    }, iterations);
    
    // Setup for multiSet test
    await this.run('multiSet', async (i) => {
      const pairs = {};
      for (let j = 0; j < 5; j++) {
        pairs[`${getKey(i)}_${j}`] = { value: j };
      }
      await this.storage.multiSet(pairs);
    }, Math.floor(iterations / 5)); // Fewer iterations for multi operations
    
    // Setup for multiGet test
    const multiGetKeys = [];
    for (let i = 0; i < 5; i++) {
      const key = `multi_get_key_${i}`;
      multiGetKeys.push(key);
      await this.storage.setItem(key, { value: i });
    }
    
    await this.run('multiGet', async () => {
      await this.storage.multiGet(multiGetKeys);
    }, iterations);
    
    // Remove test
    await this.run('removeItem', async (i) => {
      const key = getKey(i);
      await this.storage.setItem(key, value);
      await this.storage.removeItem(key);
    }, iterations);
    
    console.log('\nBenchmark Summary:');
    Object.values(this.results).forEach(result => {
      console.log(`${result.name}: ${result.opsPerSecond} ops/sec`);
    });
    
    return this.results;
  }

  /**
   * Compare with another storage library
   * @param {Object} otherStorage - Other storage library with compatible API
   * @param {number} iterations - Number of iterations (default: 100)
   */
  async compareWith(otherStorage, iterations = 100) {
    if (!otherStorage || !otherStorage.setItem || !otherStorage.getItem) {
      throw new Error('Invalid storage provided for comparison');
    }
    
    console.log('\nComparing with another storage library...');
    
    // Create a new benchmark for the other storage
    const otherBenchmark = new Benchmark(otherStorage);
    
    // Run basic benchmarks on both
    const ourResults = await this.runAll(iterations);
    const theirResults = await otherBenchmark.runAll(iterations);
    
    console.log('\nComparison Results:');
    console.log('Operation | PureStorage (ops/sec) | Other (ops/sec) | Difference');
    console.log('---------:|----------------------:|----------------:|------------');
    
    Object.keys(ourResults).forEach(name => {
      const our = ourResults[name].opsPerSecond;
      const their = theirResults[name].opsPerSecond;
      const diff = ((our - their) / their * 100).toFixed(2);
      const faster = our > their ? 'faster' : 'slower';
      
      console.log(`${name.padEnd(9)} | ${our.toString().padStart(22)} | ${their.toString().padStart(16)} | ${Math.abs(diff)}% ${faster}`);
    });
  }
}

module.exports = storage => new Benchmark(storage); 
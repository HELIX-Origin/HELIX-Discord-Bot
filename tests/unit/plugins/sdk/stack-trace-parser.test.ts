import { describe, it, expect } from 'vitest';
import { diagnoseError } from '../../../../HELIX/src/plugins/sdk/stack-trace-parser.js';

describe('stack-trace-parser', () => {
  it('diagnoses V8 TypeError with optional-chaining fix', () => {
    const diag = diagnoseError(
      'TypeError: Cannot read properties of undefined (reading \'address\')\n    at src/user.ts:42:9'
    );
    expect(diag.language).toBe('javascript');
    expect(diag.errorType).toBe('TypeError');
    expect(diag.failingLocation?.line).toBe(42);
    expect(diag.fixCode?.original).toContain('user.address');
    expect(diag.fixCode?.fixed).toContain('user?.address');
  });

  it('diagnoses ReferenceError with declaration guidance', () => {
    const diag = diagnoseError('ReferenceError: count is not defined\n    at app.js:10:2');
    expect(diag.errorType).toBe('ReferenceError');
    expect(diag.rootCause).toContain('count');
  });

  it('diagnoses Python tracebacks with line information', () => {
    const diag = diagnoseError(
      'Traceback (most recent call last):\n  File "main.py", line 7, in <module>\n    result = user.get_profile()\nAttributeError: \'NoneType\' object has no attribute \'get_profile\''
    );
    expect(diag.language).toBe('python');
    expect(diag.errorType).toBe('AttributeError');
    expect(diag.failingLocation?.line).toBe(7);
    expect(diag.fixCode?.fixed).toContain('user is not None');
  });

  it('diagnoses Python KeyError with safe-get fix', () => {
    const diag = diagnoseError(
      'Traceback (most recent call last):\nValueError: too many\nKeyError: \'missing_key\''
    );
    expect(diag.errorType).toBe('KeyError');
    expect(diag.suggestedFix).toContain('dict.get');
  });

  it('diagnoses Rust compiler errors with error codes', () => {
    const diag = diagnoseError(
      'error[E0382]: borrow of moved value\n --> src/main.rs:12:5\n |\n12 | println!("{:?}", my_struct);'
    );
    expect(diag.language).toBe('rust');
    expect(diag.errorType).toBe('error[E0382]');
    expect(diag.failingLocation?.line).toBe(12);
    expect(diag.fixCode?.original).toContain('process_data(my_struct)');
  });

  it('diagnoses Java exceptions with source file', () => {
    const diag = diagnoseError(
      'Exception in thread "main" java.lang.NullPointerException: null\n  at com.example.Util.process(User.java:88)'
    );
    expect(diag.language).toBe('java');
    expect(diag.errorType).toBe('NullPointerException');
    expect(diag.failingLocation?.file).toBe('User.java');
    expect(diag.fixCode?.fixed).toContain('str != null');
  });

  it('diagnoses Go runtime panics', () => {
    const diag = diagnoseError(
      'panic: runtime error: index out of range [5] with length 3\n\n\ngoroutine 1 [running]:\nmain.main()\n\tmain.go:33'
    );
    expect(diag.language).toBe('go');
    expect(diag.errorType).toBe('Runtime Panic');
    expect(diag.failingLocation?.file).toContain('main.go');
    expect(diag.suggestedFix).toContain('recover()');
  });

  it('falls back to a generic JavaScript diagnostic', () => {
    const diag = diagnoseError('odd unexpected text');
    expect(diag.language).toBe('javascript');
    expect(diag.errorMessage).toBe('odd unexpected text');
  });

  it('always returns the four core fields', () => {
    const diag = diagnoseError('TypeError: boom');
    for (const key of ['language', 'errorType', 'errorMessage', 'rootCause', 'suggestedFix']) {
      expect((diag as any)[key]).toBeDefined();
    }
  });
});
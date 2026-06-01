import * as fs   from 'fs'
import * as os   from 'os'
import * as path from 'path'
import { spawnSync } from 'child_process'


/**
 * Run Transcrypt on a Python source string and return the compiled JavaScript.
 *
 * Creates a temporary directory, writes the source as `<componentName>.py`,
 * invokes Transcrypt, reads the output JS, then cleans up.
 *
 * Exits the process if Transcrypt returns a non-zero exit code.
 */
export function runTranscrypt(pythonSource: string, componentName: string): string {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'pyx_transcrypt_'))

  try {
    const inputFile  = path.join(temporaryDirectory, `${componentName}.py`)
    const outputFile = path.join(temporaryDirectory, '__target__', `${componentName}.js`)

    fs.writeFileSync(inputFile, pythonSource)

    const transcryptResult = spawnSync(
      'python3',
      ['-m', 'transcrypt', '--nomin', '--esv', '6', `${componentName}.py`],
      { cwd: temporaryDirectory, encoding: 'utf8' }
    )

    if (transcryptResult.status !== 0) {
      console.error('Transcrypt stderr:\n', transcryptResult.stderr)
      console.error('Transcrypt stdout:\n', transcryptResult.stdout)
      process.exit(1)
    }

    return fs.readFileSync(outputFile, 'utf8')

  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true })
  }
}


/**
 * Run Transcrypt on a batch of Python assignment lines and return the
 * compiled JS output string, or null if compilation fails.
 *
 * Used to compile Python expressions found inside JSX {} blocks.
 */
export function runTranscryptBatch(
  pythonLines:  string[],
  batchFileName: string,
  sourcePath:   string
): string | null {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'pyx_jexpr_'))

  try {
    const inputFile  = path.join(temporaryDirectory, `${batchFileName}.py`)
    const outputFile = path.join(temporaryDirectory, '__target__', `${batchFileName}.js`)

    fs.writeFileSync(inputFile, pythonLines.join('\n'))

    const transcryptResult = spawnSync(
      'python3',
      ['-m', 'transcrypt', '--nomin', '--esv', '6', `${batchFileName}.py`],
      { cwd: temporaryDirectory, encoding: 'utf8' }
    )

    if (transcryptResult.status !== 0) {
      console.warn(
        `Warning: JSX expression batch compile failed in ${sourcePath} — leaving {} unchanged`
      )
      return null
    }

    return fs.readFileSync(outputFile, 'utf8')

  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true })
  }
}

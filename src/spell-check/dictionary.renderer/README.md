Fake BaseWindow that runs long processes (such as loading dictionaries)
in an Electron renderer thread.

Communication with the thread happens via events and remote JavaScript execution.

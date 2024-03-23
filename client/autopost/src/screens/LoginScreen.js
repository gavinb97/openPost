import logo from './../logo.svg';
import './../App.css';

function LoginScreen() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Whaddup foo
        </p>
        <body>
          <label for="textbox">Upload Files:</label>
          <input type="file" id="fileUpload" name="fileUpload" />
        </body>

        
      </header>
    </div>
  );
}

export default LoginScreen;
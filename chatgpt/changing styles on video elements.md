Absolutely! If `WhepViewer` provides a prop (like `connected` in this case) to its children, you can use the React Context API or "render props" pattern to achieve this.

I'll illustrate both methods:

### 1. Using the Render Props Pattern

The idea behind render props is to pass a function as a child (or children) to a component, and that function returns some JSX. This way, the parent component can pass down some data (props) as arguments to the function. 

Let's assume the `WhepViewer` component is set up like this:

```jsx
function WhepViewer({ url, children }) {
  const [connected, setConnected] = useState(false);
  // ... other logic

  return children(connected);
}
```

You'd use it in your `App` component this way:

```jsx
function App() {
  return (
    <React.StrictMode>
      <WhepViewer url='http://localhost:4000'>
        {(connected) => (
          <VideoWrapper mediaStream={null}>
            <video 
              autoPlay 
              controls 
              muted 
              style={{ opacity: connected ? 1 : 0.5 }}  // adjust styling based on connected value
            />
          </VideoWrapper>
        )}
      </WhepViewer>
    </React.StrictMode>
  )
}
```

### 2. Using React Context

If the `WhepViewer` component uses a Context to provide the `connected` value, you can tap into this using a Context Consumer.

Firstly, assume there's a `WhepViewerContext`:

```jsx
const WhepViewerContext = React.createContext();
```

And `WhepViewer` uses it to provide the `connected` value:

```jsx
function WhepViewer({ url, children }) {
  const [connected, setConnected] = useState(false);
  // ... other logic

  return (
    <WhepViewerContext.Provider value={connected}>
      {children}
    </WhepViewerContext.Provider>
  );
}
```

Then in your `App` component:

```jsx
function App() {
  return (
    <React.StrictMode>
      <WhepViewer url='http://localhost:4000'>
        <WhepViewerContext.Consumer>
          {(connected) => (
            <VideoWrapper mediaStream={null}>
              <video 
                autoPlay 
                controls 
                muted 
                style={{ opacity: connected ? 1 : 0.5 }}  // adjust styling based on connected value
              />
            </VideoWrapper>
          )}
        </WhepViewerContext.Consumer>
      </WhepViewer>
    </React.StrictMode>
  )
}
```

Both methods allow you to adjust the styles of the `video` element based on the `connected` value provided by the `WhepViewer` component. You can choose the method that best fits your needs and the overall structure of your project.
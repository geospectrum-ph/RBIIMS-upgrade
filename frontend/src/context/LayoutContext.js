import * as React from "react";

export const LayoutContext = React.createContext();

function LayoutContextProvider (props) {
  const [page, setPage]= React.useState('database')
  return (
    <LayoutContext.Provider value={
      { page, setPage
      }
    }>
      {props.children}
    </LayoutContext.Provider>
  )
}

export default LayoutContextProvider;
import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props{children:ReactNode;}
interface State{hasError:boolean;}

export default class ErrorBoundary extends Component<Props,State>{
  state:State={hasError:false};

  static getDerivedStateFromError():State{
    return {hasError:true};
  }

  componentDidCatch(error:Error,errorInfo:ErrorInfo){
    console.error(error,errorInfo);
  }

  render(){
    if(this.state.hasError){
      return <h2>Something went wrong.</h2>;
    }
    return this.props.children;
  }
}

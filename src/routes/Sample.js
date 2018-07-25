import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Tesla from 'lib/tesla';
import { quoteFetch } from 'lib/fetch';

import './Sample.css';

export default class Sample extends Component {
  state = {
    fetchRes: null
  };
  fetch = () => {
    const options = {
      method: 'POST',
      indicator: true,
      toastError: true,
      data: {
        type: 1,
        from: 0,
        count: 20,
        keyword: '700'
      }
    };
    quoteFetch('/searchcodelist', options)
      .then(data => {
        this.setState({ fetchRes: JSON.stringify(data) });
      })
      .catch(err => {
        this.setState({
          fetchRes: `error occurred! code: ${err.code}, msg: ${err.msg}`
        });
      });
  };
  showGlobalIndicator = () => {
    Tesla.emit(Tesla.GlobalIndicator);
    setTimeout(() => {
      Tesla.emit(Tesla.GlobalIndicator, false);
    }, 2000);
  };
  render() {
    return (
      <div styleName="container">
        <p>Demo</p>
        <Link style={{ margin: '10px 0' }} to="/">
          回首页
        </Link>
        <div>
          <button onClick={this.showGlobalIndicator}>show indicator</button>
          <button onClick={this.fetch}>fetch</button>
        </div>
        <p>{this.state.fetchRes}</p>
      </div>
    );
  }
}

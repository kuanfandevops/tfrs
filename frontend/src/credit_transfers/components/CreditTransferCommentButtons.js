import React from 'react';
import PropTypes from 'prop-types';

import * as Lang from "../../constants/langEnUs";

const CreditTransferCommentButtons = props => (
  <div className="btn-container">
    {(props.canComment && !props.isCommenting) &&
    <button
      className="btn btn-info"
      onClick={() => props.addComment()}
      disabled={props.isCommenting}
      type="button"
    >
      {Lang.BTN_COMMENT}
    </button>
    }
  </div>
);

CreditTransferCommentButtons.propTypes = {
  canComment: PropTypes.bool.isRequired,
  addComment: PropTypes.func.isRequired,
  isCommenting: PropTypes.bool.isRequired
};

export default CreditTransferCommentButtons;

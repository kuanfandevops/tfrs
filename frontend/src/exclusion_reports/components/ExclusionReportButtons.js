import React from 'react';
import PropTypes from 'prop-types';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';

import TooltipWhenDisabled from '../../app/components/TooltipWhenDisabled';
import history from '../../app/History';
import * as Lang from '../../constants/langEnUs';
import PERMISSIONS_COMPLIANCE_REPORT from '../../constants/permissions/ComplianceReport';
import COMPLIANCE_REPORTING from '../../constants/routes/ComplianceReporting';
import {download} from "../../utils/functions";
import * as Routes from "../../constants/routes";
import CREDIT_TRANSACTIONS from "../../constants/routes/CreditTransactions";


const getValidationMessages = (props) => {
  if (!props.loggedInUser.hasPermission(PERMISSIONS_COMPLIANCE_REPORT.SIGN)) {
    return 'You must have the Signing Authority role to submit an Exclusion Report to the Government of British Columbia.';
  }

  if (!props.valid) {
    return 'Please fix validation errors before submitting.';
  }

  if (props.validating) {
    return 'Validating...';
  }

  return '';
};

const ExclusionReportButtons = props => (
  <div className="exclusion-report-buttons btn-container">
    <div className="left" />
    <div className="right">
      <button
        className="btn btn-default"
        onClick={() => history.push(COMPLIANCE_REPORTING.LIST)}
        type="button"
      >
        <FontAwesomeIcon icon="arrow-circle-left" /> {Lang.BTN_APP_CANCEL}
      </button>
      {props.actions.includes('DELETE') &&
      <button
        className="btn btn-danger"
        data-target="#confirmDelete"
        data-toggle="modal"
        type="button"
      >
        <FontAwesomeIcon icon="minus-circle" /> {Lang.BTN_DELETE_DRAFT}
      </button>
      }
      {props.actions.includes('SUBMIT') && [
        <TooltipWhenDisabled
          disabled={props.validating || !props.valid}
          key="btn-save"
          title="Please fix validation errors before saving."
        >
          <button
            className="btn btn-primary"
            data-target="#confirmSave"
            data-toggle="modal"
            disabled={props.validating || !props.valid}
            type="button"
          >
            <FontAwesomeIcon icon="save" /> Save
          </button>
        </TooltipWhenDisabled>,
        <TooltipWhenDisabled
          disabled={getValidationMessages(props) !== ''}
          key="btn-submit"
          title={getValidationMessages(props)}
        >
          <button
            className="btn btn-primary"
            data-target="#confirmSubmit"
            data-toggle="modal"
            disabled={getValidationMessages(props) !== ''}
            type="button"
          >
            <FontAwesomeIcon icon="pen-fancy" /> {Lang.BTN_SUBMIT}
          </button>
        </TooltipWhenDisabled>
      ]}
      {props.actions.includes('CREATE_SUPPLEMENTAL') &&
      <button
        className="btn btn-primary"
        data-target="#confirmCreateSupplemental"
        data-toggle="modal"
        type="button"
      >
        <FontAwesomeIcon icon="clone" /> {Lang.BTN_CREATE_SUPPLEMENTAL}
      </button>
      }
      {props.actor === 'ANALYST' &&
      props.actions.includes('REQUEST_SUPPLEMENTAL') &&
        <button
          className="btn btn-info"
          data-target="#confirmAnalystRequestSupplemental"
          data-toggle="modal"
          key="btn-analyst-request-supplemental"
          type="button"
        >
          <FontAwesomeIcon icon="exclamation-circle" /> {Lang.BTN_REQUEST_SUPPLEMENTAL}
        </button>
      }
      {props.actor === 'ANALYST' &&
      props.actions.includes('DISCOMMEND') &&
        <button
          className="btn btn-danger"
          data-target="#confirmAnalystRecommendRejection"
          data-toggle="modal"
          key="btn-analyst-recommend-rejection"
          type="button"
        >
          <FontAwesomeIcon icon="times" /> {Lang.BTN_RECOMMEND_FOR_REJECTION}
        </button>
      }
      {props.actor === 'ANALYST' &&
      props.actions.includes('RECOMMEND') &&
        <button
          className="btn btn-primary"
          data-target="#confirmAnalystRecommendAcceptance"
          data-toggle="modal"
          key="btn-analyst-recommend-acceptance"
          type="button"
        >
          <FontAwesomeIcon icon="check" /> {Lang.BTN_RECOMMEND_FOR_ACCEPTANCE}
        </button>
      }
      {props.actor === 'MANAGER' &&
      props.actions.includes('REQUEST_SUPPLEMENTAL') &&
        <button
          className="btn btn-info"
          data-target="#confirmManagerRequestSupplemental"
          data-toggle="modal"
          key="btn-manager-request-supplemental"
          type="button"
        >
          <FontAwesomeIcon icon="exclamation-circle" /> {Lang.BTN_REQUEST_SUPPLEMENTAL}
        </button>
      }
      {props.actor === 'MANAGER' &&
      props.actions.includes('DISCOMMEND') &&
        <button
          className="btn btn-danger"
          data-target="#confirmManagerRecommendRejection"
          data-toggle="modal"
          key="btn-manager-recommend-rejection"
          type="button"
        >
          <FontAwesomeIcon icon="times" /> {Lang.BTN_RECOMMEND_FOR_REJECTION}
        </button>
      }
      {props.actor === 'MANAGER' &&
      props.actions.includes('RECOMMEND') &&
        <button
          className="btn btn-primary"
          data-target="#confirmManagerRecommendAcceptance"
          data-toggle="modal"
          key="btn-manager-recommend-acceptance"
          type="button"
        >
          <FontAwesomeIcon icon="check" /> {Lang.BTN_RECOMMEND_FOR_ACCEPTANCE}
        </button>
      }
      {props.actor === 'DIRECTOR' &&
      props.actions.includes('REJECT') &&
        <button
          className="btn btn-danger"
          data-target="#confirmDirectorReject"
          data-toggle="modal"
          key="btn-director-reject"
          type="button"
        >
          <FontAwesomeIcon icon="times" /> {Lang.BTN_REJECT}
        </button>
      }
      {props.actor === 'DIRECTOR' &&
      props.actions.includes('ACCEPT') &&
        <button
          className="btn btn-primary"
          data-target="#confirmDirectorAccept"
          data-toggle="modal"
          key="btn-director-accept"
          type="button"
        >
          <FontAwesomeIcon icon="check" /> {Lang.BTN_ACCEPT}
        </button>
      }
      <button
        className="btn btn-info"
        id="download-report"
        type="button"
        onClick={(e) => {
          const element = e.target;
          const original = element.innerHTML;

          element.firstChild.textContent = ' Downloading...';

          const url = Routes.BASE_URL + COMPLIANCE_REPORTING.EXPORT.replace(':id', props.id);

          return download(url).then(() => {
            element.innerHTML = original;
          });
        }}
      >
        <FontAwesomeIcon icon="file-excel" /> <span>Download as .xls</span>
      </button>

      <button
        className="btn btn-default"
        onClick={() => history.push(COMPLIANCE_REPORTING.LIST)}
        type="button"
      >
        <FontAwesomeIcon icon="arrow-circle-left" /> {Lang.BTN_APP_CANCEL}
      </button>
    </div>
  </div>
);

ExclusionReportButtons.defaultProps = {
  actions: [],
  actor: '',
  validating: false,
  valid: true,
  validationMessages: {}
};

ExclusionReportButtons.propTypes = {
  id: PropTypes.string,
  actions: PropTypes.arrayOf(PropTypes.string),
  actor: PropTypes.string,
  edit: PropTypes.bool.isRequired,
  loggedInUser: PropTypes.shape({
    hasPermission: PropTypes.func
  }).isRequired,
  saving: PropTypes.bool.isRequired,
  validating: PropTypes.bool,
  valid: PropTypes.bool,
  validationMessages: PropTypes.shape()
};

export default ExclusionReportButtons;

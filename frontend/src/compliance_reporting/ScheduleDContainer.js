/*
 * Container component
 * All data handling & manipulation should be handled here.
 */

import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';

import ComplianceReportingStatusHistory from './components/ComplianceReportingStatusHistory';
import ScheduleDOutput from './components/ScheduleDOutput';
import ScheduleDSheet from './components/ScheduleDSheet';
import ScheduleDTabs from './components/ScheduleDTabs';
import Select from '../app/components/Spreadsheet/Select';
import TooltipWhenDisabled from '../app/components/TooltipWhenDisabled';
import {
  SCHEDULE_D,
  SCHEDULE_D_INPUT,
  SCHEDULE_D_INPUT_ERROR_KEYS
} from '../constants/schedules/scheduleColumns';

import ScheduleInstructions from './components/ScheduleInstructions';
import ValidationMessages from './components/ValidationMessages';

class ScheduleDContainer extends Component {
  static clearErrorOutput (_output) {
    const output = _output;
    output.forEach((row, index) => {
      const { className } = row[1];

      if (className && className.indexOf('error') >= 0) {
        output[index][1] = {
          ...row[1],
          className: className.replace(/error/g, '')
        };
      }
    });

    return output;
  }

  constructor (props) {
    super(props);

    this.state = {
      activeSheet: 0,
      sheets: []
    };

    this.rowNumber = 1;

    this._addHeaders = this._addHeaders.bind(this);
    this._addSheet = this._addSheet.bind(this);
    this._handleSheetChanged = this._handleSheetChanged.bind(this);
    this._gridStateToPayload = this._gridStateToPayload.bind(this);
    this._setActiveSheet = this._setActiveSheet.bind(this);
    this._validate = this._validate.bind(this);
    this.loadInitialState = this.loadInitialState.bind(this);
  }

  componentDidMount () {
    if (this.props.scheduleState.scheduleD || this.props.snapshot) {
      // it's probably more elegant to use getDerivedStateFromProps,
      // but it is defined static and we need to access instance methods to set the headers
      this.componentWillReceiveProps(this.props);
      // we already have the state. don't load it. just render it.
    } else if (!this.props.complianceReport.scheduleD) {
      this._addSheet();
    } else {
      this.loadInitialState();
    }
  }

  componentWillReceiveProps (nextProps, nextContext) {
    const { sheets } = this.state;

    let source = nextProps.scheduleState.scheduleD;
    if (nextProps.snapshot) {
      source = this.props.snapshot.scheduleD;
    }

    if (source && source.sheets) {
      if ((sheets.length) < source.sheets.length) {
        this._addSheet(source.sheets.length - (sheets.length));
      }

      for (let i = 0; i < source.sheets.length; i += 1) {
        const sheet = source.sheets[i];
        if (sheets.length < i) {
          sheets.push(this._addHeaders(sheets.length));
        }

        sheets[i].input[1][SCHEDULE_D_INPUT.FUEL_TYPE].value = sheet.fuelType;
        sheets[i].input[1][SCHEDULE_D_INPUT.FEEDSTOCK].value = sheet.feedstock;
        sheets[i].input[1][SCHEDULE_D_INPUT.FUEL_CLASS].value = sheet.fuelClass;

        for (let j = 0; j < sheet.inputs.length; j += 1) {
          if (j >= sheets[i].grid.length - 1) {
            sheets[i].grid.push([{
              readOnly: true,
              value: j + 1
            }, {
              className: 'text',
              readOnly: nextProps.readOnly
            }, {
              className: 'text',
              readOnly: nextProps.readOnly
            }, {
              className: 'text',
              readOnly: nextProps.readOnly
            }, {
              className: 'text',
              readOnly: nextProps.readOnly
            }, {
              className: 'text',
              readOnly: nextProps.readOnly
            }]);
          }

          sheets[i].grid[1 + j][SCHEDULE_D.CELL].value = sheet.inputs[j].cell;
          sheets[i].grid[1 + j][SCHEDULE_D.WORKSHEET_NAME].value = sheet.inputs[j].worksheetName;
          sheets[i].grid[1 + j][SCHEDULE_D.VALUE].value = sheet.inputs[j].value;
          sheets[i].grid[1 + j][SCHEDULE_D.UNITS].value = sheet.inputs[j].units;
          sheets[i].grid[1 + j][SCHEDULE_D.DESCRIPTION].value = sheet.inputs[j].description;
        }

        // zero remaining rows
        for (let row = sheet.inputs.length + 1; row < sheets[i].grid.length; row += 1) {
          sheets[i].grid[row][SCHEDULE_D.CELL].value = null;
          sheets[i].grid[row][SCHEDULE_D.WORKSHEET_NAME].value = null;
          sheets[i].grid[row][SCHEDULE_D.VALUE].value = null;
          sheets[i].grid[row][SCHEDULE_D.UNITS].value = null;
          sheets[i].grid[row][SCHEDULE_D.DESCRIPTION].value = null;
        }

        for (let j = 0; j < sheet.outputs.length; j += 1) {
          const rowIndex = sheets[i].output.findIndex(x =>
            x[0].value === sheet.outputs[j].description);
          if (rowIndex !== -1) {
            sheets[i].output[rowIndex][1] = {
              ...sheets[i].output[rowIndex][1],
              readOnly: nextProps.readOnly,
              value: sheet.outputs[j].intensity
            };
          }
        }

        sheets[i].output = ScheduleDSheet.calculateTotal(sheets[i].output);

        if (!this.props.snapshot && !this.props.validating) {
          sheets[i] = this._validate(sheets[i], i);
        }
      }

      this.setState({ sheets });
    }
  }

  loadInitialState () {
    this.rowNumber = 1;

    const sheets = [];

    for (let i = 0; i < this.props.complianceReport.scheduleD.sheets.length; i += 1) {
      const sheet = {
        ...this.props.complianceReport.scheduleD.sheets[i]
      };
      sheet.inputs = [];
      sheet.outputs = [];

      for (let j = 0; j < this.props.complianceReport.scheduleD.sheets[i].inputs.length; j += 1) {
        sheet.inputs.push({ ...this.props.complianceReport.scheduleD.sheets[i].inputs[j] });
      }
      for (let j = 0; j < this.props.complianceReport.scheduleD.sheets[i].outputs.length; j += 1) {
        sheet.outputs.push({ ...this.props.complianceReport.scheduleD.sheets[i].outputs[j] });
      }

      sheets.push(sheet);
      this.props.updateScheduleState({
        scheduleD: {
          sheets
        }
      });
    }
  }

  _addHeaders (id) {
    return {
      grid: [
        [{
          className: 'row-number',
          readOnly: true
        }, {
          className: 'worksheet-name',
          readOnly: true,
          value: (
            <div>
              {`Worksheet Name `}
              <TooltipWhenDisabled
                className="info"
                disabled
                title="The worksheet in the GHGenius model where the change is made (e.g. Input, Coprods, etc.)."
              >
                <FontAwesomeIcon icon="info-circle" />
              </TooltipWhenDisabled>
            </div>
          )
        }, {
          className: 'worksheet-cell',
          readOnly: true,
          value: (
            <div>
              {`Cell `}
              <TooltipWhenDisabled
                className="info"
                disabled
                title="The cell reference in which the change is made (e.g. A1, D155, etc.)."
              >
                <FontAwesomeIcon icon="info-circle" />
              </TooltipWhenDisabled>
            </div>
          )
        }, {
          className: 'worksheet-value',
          readOnly: true,
          value: (
            <div>
              {`Value `}
              <TooltipWhenDisabled
                className="info"
                disabled
                title="The value that is replacing the default value."
              >
                <FontAwesomeIcon icon="info-circle" />
              </TooltipWhenDisabled>
            </div>
          )
        }, {
          className: 'units',
          readOnly: true,
          value: (
            <div>
              {`Units `}
              <TooltipWhenDisabled
                className="info"
                disabled
                title="The unit given for the Reported Value (e.g L, L/MJ, etc.)."
              >
                <FontAwesomeIcon icon="info-circle" />
              </TooltipWhenDisabled>
            </div>
          )
        }, {
          className: 'description',
          readOnly: true,
          value: (
            <div>
              {`Description `}
              <TooltipWhenDisabled
                className="info"
                disabled
                title="A brief description of the nature of the input (e.g. feedstock transportation mode, natural gas usage, etc.)."
              >
                <FontAwesomeIcon icon="info-circle" />
              </TooltipWhenDisabled>
            </div>
          )
        }] // spreadsheet header
      ],
      input: [
        [{
          className: 'fuel-type',
          readOnly: true,
          value: 'Part 3 Fuel Type'
        }, {
          className: 'feedstock',
          readOnly: true,
          value: (
            <div>
              {`Feedstock `}
              <TooltipWhenDisabled
                className="info"
                disabled
                title="The feedstock used to produce the fuel (e.g. corn, soy, etc.)."
              >
                <FontAwesomeIcon icon="info-circle" />
              </TooltipWhenDisabled>
            </div>
          )
        }, {
          className: 'fuel-class',
          readOnly: true,
          value: (
            <div>
              {`Fuel Class `}
              <TooltipWhenDisabled
                className="info"
                disabled
                title="The fuel class in which the fuel was used."
              >
                <FontAwesomeIcon icon="info-circle" />
              </TooltipWhenDisabled>
            </div>
          )
        }],
        [{
          className: 'text dropdown-indicator',
          readOnly: this.props.readOnly,
          dataEditor: Select,
          getOptions: () => this.props.referenceData.approvedFuels,
          mapping: {
            key: 'id',
            value: 'name'
          }
        }, {
          className: 'text',
          readOnly: this.props.readOnly
        }, {
          className: 'text dropdown-indicator',
          readOnly: this.props.readOnly,
          dataEditor: Select,
          getOptions: row => this._getFuelClasses(row, id),
          mapping: {
            key: 'id',
            value: 'fuelClass'
          }
        }]
      ],
      id,
      output: ScheduleDOutput(this.props.readOnly)
    };
  }

  _addSheet (sheetsToAdd = 1) {
    const { sheets } = this.state;

    for (let i = 0; i < sheetsToAdd; i += 1) {
      const sheet = this._addHeaders(sheets.length);

      sheets.push(sheet);
    }

    this.setState({
      sheets
    });
  }

  _getFuelClasses (row, id) {
    const fuelType = this.state.sheets[id].input[row][SCHEDULE_D_INPUT.FUEL_TYPE];

    const selectedFuel = this.props.referenceData.approvedFuels
      .find(fuel => fuel.name === fuelType.value);

    if (selectedFuel) {
      return selectedFuel.fuelClasses;
    }

    return [];
  }

  _handleSheetChanged (grid, index) {
    const { sheets } = this.state;

    sheets[index] = {
      ...sheets[index],
      ...grid
    };

    this.setState({
      sheets
    });

    this._gridStateToPayload({
      sheets
    });
  }

  _gridStateToPayload (state) {
    const sheets = [];

    for (let i = 0; i < state.sheets.length; i += 1) {
      const sheet = state.sheets[i];

      const sheetRecord = {
        fuelClass: sheet.input[1][SCHEDULE_D_INPUT.FUEL_CLASS].value,
        feedstock: sheet.input[1][SCHEDULE_D_INPUT.FEEDSTOCK].value,
        fuelType: sheet.input[1][SCHEDULE_D_INPUT.FUEL_TYPE].value,
        inputs: [],
        outputs: []
      };

      for (let j = 1; j < sheet.grid.length; j += 1) {
        const inputRecord = {
          cell: sheet.grid[j][SCHEDULE_D.CELL].value,
          worksheetName: sheet.grid[j][SCHEDULE_D.WORKSHEET_NAME].value,

          value: sheet.grid[j][SCHEDULE_D.VALUE].value,
          units: sheet.grid[j][SCHEDULE_D.UNITS].value,
          description: sheet.grid[j][SCHEDULE_D.DESCRIPTION].value
        };
        const atLeastOneCellFilled = (
          inputRecord.cell || inputRecord.worksheetName || inputRecord.value ||
          inputRecord.units || inputRecord.description
        );
        if (atLeastOneCellFilled) {
          sheetRecord.inputs.push(inputRecord);
        }
      }

      let outputHasContent = false;

      for (let j = 0; j < sheet.output.length; j += 1) {
        const isTotalField = sheet.output[j][1].readOnly;

        if (!isTotalField) {
          const outputRecord = {
            description: sheet.output[j][0].value,
            intensity: Number.isNaN(Number(sheet.output[j][1].value)) ? 0 : sheet.output[j][1].value
          };

          if (outputRecord.intensity !== '') {
            sheetRecord.outputs.push(outputRecord);
          }

          if (outputRecord.intensity !== 0) {
            outputHasContent = true;
          }
        }
      }

      if (sheetRecord.fuelClass || sheetRecord.feedstock ||
        sheetRecord.fuelType || sheetRecord.inputs.length > 0 || outputHasContent) {
        sheets.push(sheetRecord);
      }
    }

    if (sheets.length > 0) {
      this.props.updateScheduleState({
        scheduleD: {
          sheets
        }
      });
    } else {
      this.props.updateScheduleState({
        scheduleD: null
      });
    }
  }

  _setActiveSheet (id) {
    this.setState({
      activeSheet: id
    });
  }

  _validate (_sheet, sheetIndex) {
    const sheet = _sheet;

    if (
      this.props.valid ||
      (this.props.validationMessages && !this.props.validationMessages.scheduleD)
    ) {
      const errorKeys = Object.keys(SCHEDULE_D_INPUT_ERROR_KEYS);

      sheet.output = ScheduleDContainer.clearErrorOutput(sheet.output);

      errorKeys.forEach((errorKey) => {
        const col = SCHEDULE_D_INPUT_ERROR_KEYS[errorKey];

        sheet.input[1][col].className = sheet.input[1][col].className.replace(/error/g, '');
      });
      sheet.output = ScheduleDContainer.clearErrorOutput(sheet.output);
    } else if (
      this.props.validationMessages &&
      this.props.validationMessages.scheduleD &&
      this.props.validationMessages.scheduleD.sheets &&
      this.props.validationMessages.scheduleD.sheets.length > (sheetIndex)) {
      const errors = Object.keys(this.props.validationMessages.scheduleD.sheets[sheetIndex]);
      const errorKeys = Object.keys(SCHEDULE_D_INPUT_ERROR_KEYS);

      sheet.output = ScheduleDContainer.clearErrorOutput(sheet.output);

      errorKeys.forEach((errorKey) => {
        const col = SCHEDULE_D_INPUT_ERROR_KEYS[errorKey];

        if (errors.indexOf(errorKey) < 0) {
          sheet.input[1][col].className = sheet.input[1][col].className.replace(/error/g, '');
        }
      });

      errors.forEach((errorKey) => {
        if (errorKey in SCHEDULE_D_INPUT_ERROR_KEYS) {
          const col = SCHEDULE_D_INPUT_ERROR_KEYS[errorKey];
          let { className } = sheet.input[1][col];

          if (sheet.input[1][col].className.indexOf('error') < 0) {
            className += ' error';
          }

          sheet.input[1][col] = {
            ...sheet.input[1][col],
            className
          };
        }
      });

      if (errors.indexOf('outputs') >= 0) {
        const { outputs } = this.props.validationMessages.scheduleD.sheets[sheetIndex];

        outputs.forEach((outputError) => {
          const rowLabel = outputError.replace(/Missing value for /g, '');

          const index = sheet.output.findIndex(row => (row[0].value === rowLabel));

          if (index >= 0) {
            let { className } = sheet.output[index][1];

            if (sheet.output[index][1].className.indexOf('error') < 0) {
              className += ' error';
            }

            sheet.output[index][1] = {
              ...sheet.output[index][1],
              className
            };
          }
        });
      }
    }

    return sheet;
  }

  renderSheets () {
    const { sheets } = this.state;

    return (
      <div className="page_schedule spreadsheet-component" key="sheets">
        <h1>Schedule D - GHGenius Input and Output Summaries</h1>

        <ComplianceReportingStatusHistory
          complianceReport={this.props.complianceReport}
          key="history"
        />

        {!this.props.readOnly && [
          <ValidationMessages
            activeSheet={this.state.activeSheet}
            key="validation-messages"
            scheduleType="schedule-d"
            valid={this.props.valid}
            validating={this.props.validating}
            validationMessages={this.props.validationMessages}
          />,
          <ScheduleInstructions
            key="schedule-instructions"
            scheduleType="schedule-d"
          />
        ]}

        <ScheduleDTabs
          active={this.state.activeSheet}
          addSheet={this._addSheet}
          addSheetEnabled={!this.props.readOnly}
          sheets={sheets}
          setActiveSheet={this._setActiveSheet}
        />

        {sheets.map(sheet => (
          <div className={this.state.activeSheet === sheet.id ? 'active' : 'inactive'} key={sheet.id}>
            <ScheduleDSheet
              addHeaders={this._addHeaders}
              addRowEnabled={!this.props.readOnly}
              handleSheetChanged={this._handleSheetChanged}
              id={sheet.id}
              match={this.props.match}
              referenceData={this.props.referenceData}
              sheet={sheet}
              readOnly={this.props.readOnly}
              valid={this.props.valid}
              validating={this.props.validating}
              validationMessages={this.props.validationMessages}
            />
          </div>
        ))}
      </div>
    );
  }

  render () {
    return ([
      this.renderSheets()
    ]);
  }
}

ScheduleDContainer.defaultProps = {
  complianceReport: null,
  match: {},
  validationMessages: null,
  snapshot: null
};

ScheduleDContainer.propTypes = {
  complianceReport: PropTypes.shape({
    scheduleD: PropTypes.shape()
  }),
  match: PropTypes.shape({}),
  readOnly: PropTypes.bool.isRequired,
  referenceData: PropTypes.shape({
    approvedFuels: PropTypes.arrayOf(PropTypes.shape)
  }).isRequired,
  scheduleState: PropTypes.shape({
    scheduleD: PropTypes.shape({
      sheets: PropTypes.arrayOf(PropTypes.shape())
    })
  }).isRequired,
  snapshot: PropTypes.shape({
    scheduleD: PropTypes.shape({
      sheets: PropTypes.arrayOf(PropTypes.shape())
    })
  }),
  updateScheduleState: PropTypes.func.isRequired,
  valid: PropTypes.bool.isRequired,
  validating: PropTypes.bool.isRequired,
  validationMessages: PropTypes.shape()
};

const mapStateToProps = state => ({
  referenceData: {
    approvedFuels: state.rootReducer.referenceData.data.approvedFuels
  }
});

export default connect(mapStateToProps, null)(ScheduleDContainer);

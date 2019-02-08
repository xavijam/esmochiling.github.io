import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { find, mapValues, size, isEmpty } from 'lodash'
import { translate } from 'react-i18next'

import Error from '../_error'
import Link from '../../src/components/Link'
import Head from '../../src/components/Head'
import Form from '../../src/components/form/Form'
import genFields from './experienceFields'
import { updateExperience, createExperience } from '../../src/actions/ExperienceActions'
import { wrapper, i18nHelper } from '../../src/components/i18n'

class ExperienceEdit extends Component {
  state = {
    loading: false,
    error: null
  }

  static async getInitialProps({ store, query, isServer }) {
    const { experienceSlug, memberId } = query

    return {
      memberId,
      experienceSlug,
      isServer
    }
  }

  filterData = data => {
    return mapValues(data, (value, key) => {
      if (key === 'startDate' || key === 'endDate') {
        return new Date(value)
      } else if (key === 'imagesListURL') {
        return (value && size(value) > 0 && value.split(',')) || []
      } else {
        return value
      }
    })
  }

  onSubmit = async data => {
    const { updateExperience, createExperience } = this.props
    const filteredData = this.filterData(data)
    const onDone = ({ data, error }) => {
      return error
    }
    const { id } = data
    let error

    this.setState({ loading: true, error: null })

    if (id) {
      error = await updateExperience(filteredData).then(onDone)
    } else {
      error = await createExperience(filteredData).then(onDone)
      if (!error) {
        window.location.href = '/experiences'
      }
    }

    this.setState({ loading: false, error: (error && error.message) || null })
  }

  render() {
    const { memberId, user, experiences, experienceSlug, members, t, children } = this.props
    const { loading, error } = this.state
    let experienceData = {}
    const lang = i18nHelper.getCurrentLanguage()

    const fields = genFields({ t, experiences, experienceSlug, members, memberId })

    if (user.state !== 'logged') {
      return <Error status={403} />
    }

    if (experienceSlug && memberId) {
      experienceData = find(experiences, experience => {
        if (experience.slug === experienceSlug && experience.authors.includes(memberId)) {
          return true
        } else {
          return false
        }
      })

      if (!experienceData) {
        return <Error status={404} />
      }
    }

    return (
      <Fragment>
        <Head title={experienceData.title && experienceData.title[lang]} />

        <div className="Block" ref={node => (this.block = node)}>
          {children} {/*Header*/}
          <div className="Breadcrumb">
            <ul className="Breadcrumb-inner">
              <li className="Breadcrumb-item">
                <Link href="/team">
                  <a className="Breadcrumb-link">{t('title')}</a>
                </Link>
              </li>
              {!isEmpty(experienceData) && (
                <Fragment>
                  <li className="Breadcrumb-item Breadcrumb-item--separator">></li>
                  <li className="Breadcrumb-item">{experienceData.title && experienceData.title[lang]}</li>
                </Fragment>
              )}
            </ul>
          </div>
          <div className="Block-content">
            <Form onSubmit={this.onSubmit} fields={fields} formData={experienceData} disabled={loading} />
            {error && <p className="Text Color--error u-tSpace--m">{error}</p>}
          </div>
        </div>
      </Fragment>
    )
  }
}

function mapStateToProps(state) {
  return {
    members: state.members,
    experiences: state.experiences,
    user: state.user
  }
}

const mapDispatchToProps = dispatch => {
  return {
    updateExperience: bindActionCreators(updateExperience, dispatch),
    createExperience: bindActionCreators(createExperience, dispatch)
  }
}

export default wrapper(
  translate(['experiences'])(
    connect(
      mapStateToProps,
      mapDispatchToProps
    )(ExperienceEdit)
  )
)

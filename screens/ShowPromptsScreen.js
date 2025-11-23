import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import React, {useState} from 'react';
import { colors } from '../utils/theme';
import {useNavigation, useRoute} from '@react-navigation/native';
import BackHeader from '../components/BackHeader';

const ShowPromptsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [prompts, setPrompts] = useState([]);
  const [option, setOption] = useState('About me');
  const [answer, setAnswer] = useState('');
  const promptss = [
    {
      id: '0',
      name: 'About me',
      questions: [
        {
          id: '10',
          question: 'A random fact I love is',
        },
        {
          id: '11',
          question: 'Typical Sunday',
        },
        {
          id: '12',
          question: 'I go crazy for',
        },
        {
          id: '13',
          question: 'Unusual Skills',
        },
        {
          id: '14',
          question: 'My greatest strenght',
        },
        {
          id: '15',
          question: 'My simple pleasures',
        },
        {
          id: '16',
          question: 'A life goal of mine',
        },
        {
          id: '17',
          question: 'My most irrational fear',
        },
        {
          id: '18',
          question: 'I am convinced that',
        },
        {
          id: '19',
          question: 'The way to win me over is',
        },
      ],
    },
    {
      id: '2',
      name: 'Self Care',
      questions: [
        {
          id: '10',
          question: 'I unwind by',
        },
        {
          id: '11',
          question: 'A boundary of mine is',
        },
        {
          id: '12',
          question: 'I feel most supported when',
        },
        {
          id: '13',
          question: 'I hype myself up by',
        },
        {
          id: '14',
          question: 'To me, relaxation is',
        },
        {
          id: '15',
          question: 'I beat my blues by',
        },
        {
          id: '16',
          question: 'My skin care routine',
        },
      ],
    },

    {
      id: '3',
      name: 'Getting Personal',
      questions: [
        {
          id: '10',
          question: 'I geek out on',
        },
        {
          id: '11',
          question: 'If loving this is wrong, I dont want to be right',
        },
        {
          id: '12',
          question: 'They key to my heart is',
        },
        {
          id: '13',
          question: 'What if I told you that',
        },
        {
          id: '14',
          question: 'Dont hate me if I',
        },
        {
          id: '15',
          question: 'I wont shut up about',
        },
        {
          id: '16',
          question: 'My Love Language is',
        },
        {
          id: '17',
          question: 'The one thing you should know about me is',
        },
      ],
    },
    {
      id: '13',
      name: "Let's chat about",
      questions: [
        {
          id: '10',
          question: 'I bet you cant',
        },
        {
          id: '11',
          question: 'you should leave a comment if',
        },
        {
          id: '12',
          question: 'I will pick the topic if you start the conversation',
        },
        {
          id: '13',
          question: 'Try to guess this about me',
        },
        {
          id: '14',
          question: 'Do you agree or disagree that ',
        },
        {
          id: '15',
          question: 'Give me travel tips for',
        },
        {
          id: '16',
          question: 'Teach me something about',
        },
      ],
    },
    {
      id: '4',
      name: 'Date Vibes',
      questions: [
        {
          id: '10',
          question: 'Together we could',
        },
        {
          id: '11',
          question: 'I know the best spot in town for',
        },
        {
          id: '12',
          question: 'First round is on me if',
        },
        {
          id: '13',
          question: 'The best way to ask me out is by',
        },
        {
          id: '14',
          question: 'What I order for the table',
        },
      ],
    },
    {
      id: '34',
      name: 'My type',
      questions: [
        {
          id: '10',
          question: 'I would fall for you if',
        },
        {
          id: '11',
          question: 'We are the same type of weird if',
        },
        {
          id: '12',
          question: 'Green flags I look out for',
        },
        {
          id: '13',
          question: 'I am weirdly attracted to',
        },
        {
          id: '14',
          question: 'I want someone who',
        },
        {
          id: '16',
          question: 'All I ask is that you',
        },
        {
          id: '17',
          question: 'I am looking for',
        },
        {
          id: '18',
          question: 'We will get along if ',
        },
      ],
    },
  ];
  return (
    <SafeAreaView
      style={{
        paddingTop: Platform.OS === 'android' ? 35 : 0,
        flex: 1,
        backgroundColor: colors.card,
      }}>
      <BackHeader title="Select a Prompt" />
      <ScrollView>
        <View
          style={{
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text style={{fontSize: 15, fontWeight: '500', color: '#581845'}}>
            View All
          </Text>
          <Text style={{fontSize: 16, fontWeight: '500', color: '#581845'}}>
            Prompts
          </Text>
        </View>

        <View
          style={{
            marginHorizontal: 10,
            marginTop: 20,
            flexDirection: 'row',
            gap: 10,
          }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {promptss?.map((item, index) => (
              <View>
                <Pressable
                  onPress={() => setOption(item?.name)}
                  style={{
                      padding: 12,
                      borderRadius: 20,
                      backgroundColor: option == item?.name ? colors.primary : colors.card,
                    }}>
                    <Text
                      style={{
                        textAlign: 'center',
                        color: option == item?.name ? colors.onPrimary : colors.text,
                        fontSize: 13,
                      }}>
                    {item?.name}
                  </Text>
                </Pressable>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={{marginTop: 6, marginHorizontal: 12}}>
          {promptss?.map((item, index) => (
            <View>
              {option == item?.name && (
                <View>
                  {item?.questions?.map((question, idx) => (
                    <>
                      <Pressable
                        onPress={() =>
                          navigation.navigate('WritePrompt', {
                            question: question?.question,
                            prompts: route?.params?.prompts,
                            setPrompts: route?.params?.setPrompts,
                            index: route?.params?.index,
                          })
                        }
                        style={{marginVertical: 20}}>
                        <Text
                          style={{
                            fontSize: 15,
                            fontWeight: '500',
                            color: '#202020',
                          }}>
                          {question?.question}
                        </Text>
                      </Pressable>

                      <View
                        style={{borderColor: '#E0E0E0', borderWidth: 0.5}}
                      />
                    </>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ShowPromptsScreen;

const styles = StyleSheet.create({});
